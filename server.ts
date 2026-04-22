import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import crypto from "crypto";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT || 3000;

  // Initialize PostgreSQL Database
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'NatEvan12!!',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'omnibase'
  });

  const db = {
    query: async (text: string, params?: any[]) => {
      return pool.query(text, params);
    },
    prepare: (sql: string) => ({
      run: async (...params: any[]) => {
        return pool.query(sql, params);
      },
      get: async (...params: any[]) => {
        const result = await pool.query(sql, params);
        return result.rows[0];
      },
      all: async (...params: any[]) => {
        const result = await pool.query(sql, params);
        return result.rows;
      }
    })
  };

  // Create tables for knowledge base
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      content TEXT,
      tags TEXT,
      author_id TEXT,
      author_name TEXT,
      metadata TEXT,
      version_count INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      content TEXT,
      author_id TEXT,
      author_name TEXT,
      change_summary TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(unit_id) REFERENCES units(id)
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(unit_id) REFERENCES units(id)
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      text TEXT NOT NULL,
      start_index INTEGER,
      end_index INTEGER,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(unit_id) REFERENCES units(id)
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'viewer',
      permissions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT
    )`);
    
    console.log('[OmniBase] Database tables initialized successfully');
  } catch (err) {
    console.log('[OmniBase] Tables may already exist:', err instanceof Error ? err.message : 'Unknown error');
  }

  app.use(express.json());

  // WebSocket Server
  const wss = new WebSocketServer({ server });
  const clients = new Map<string, Set<WebSocket>>(); // Map unitId -> clients

  wss.on("connection", (ws) => {
    let currentUnitId: string | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());

      if (data.type === "join") {
        currentUnitId = data.unitId;
        if (!clients.has(currentUnitId!)) {
          clients.set(currentUnitId!, new Set());
        }
        clients.get(currentUnitId!)!.add(ws);
        
        // Broadcast presence
        broadcastToUnit(currentUnitId!, { type: "presence", userId: data.userId, action: "joined" });
      }

      if (data.type === "comment") {
        broadcastToUnit(data.unitId, { type: "new_comment", ...data.comment });
      }

      if (data.type === "edit_ping") {
        broadcastToUnit(data.unitId, { type: "user_editing", userId: data.userId, userName: data.userName }, ws);
      }
    });

    ws.on("close", () => {
      if (currentUnitId && clients.has(currentUnitId)) {
        clients.get(currentUnitId)!.delete(ws);
        if (clients.get(currentUnitId)!.size === 0) {
          clients.delete(currentUnitId);
        }
      }
    });
  });

  function broadcastToUnit(unitId: string, data: any, excludeWs?: WebSocket) {
    const unitClients = clients.get(unitId);
    if (unitClients) {
      const payload = JSON.stringify(data);
      unitClients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "OmniBase Core v1.1.0" });
  });

  // Knowledge Units API
  app.get("/api/units", (req, res) => {
    const parentId = req.query.parentId as string || null;
    const stmt = db.prepare("SELECT * FROM units WHERE parent_id " + (parentId ? "= ?" : "IS NULL"));
    const units = parentId ? stmt.all(parentId) : stmt.all();
    res.json(units.map((u: any) => ({ ...u, tags: JSON.parse(u.tags || "[]") })));
  });

  app.get("/api/units/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM units WHERE id = ?");
    const unit: any = stmt.get(req.params.id);
    if (unit) {
      unit.tags = JSON.parse(unit.tags || "[]");
      res.json(unit);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/units", (req, res) => {
    const { id, name, type, parent_id, content, tags, author_id, author_name } = req.body;
    const stmt = db.prepare(`
      INSERT INTO units (id, name, type, parent_id, content, tags, author_id, author_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, type, parent_id, content, JSON.stringify(tags || []), author_id, author_name);
    
    // Create initial version
    const vId = crypto.randomUUID();
    const vStmt = db.prepare(`
      INSERT INTO versions (id, unit_id, version_number, content, author_id, author_name, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    vStmt.run(vId, id, 1, content, author_id, author_name, "Initial version");

    res.status(201).json({ success: true });
  });

  // Update & Versioning
  app.patch("/api/units/:id", (req, res) => {
    const { content, author_id, author_name, change_summary } = req.body;
    
    // Start transaction
    const transaction = db.transaction(() => {
      const unit: any = db.prepare("SELECT version_count FROM units WHERE id = ?").get(req.params.id);
      const nextVersion = (unit?.version_count || 0) + 1;

      db.prepare("UPDATE units SET content = ?, version_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(content, nextVersion, req.params.id);

      db.prepare(`
        INSERT INTO versions (id, unit_id, version_number, content, author_id, author_name, change_summary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), req.params.id, nextVersion, content, author_id, author_name, change_summary);
    });

    transaction();
    res.json({ success: true });
  });

  // Versions API
  app.get("/api/units/:id/versions", (req, res) => {
    const stmt = db.prepare("SELECT * FROM versions WHERE unit_id = ? ORDER BY version_number DESC");
    res.json(stmt.all(req.params.id));
  });

  // Comments API
  app.get("/api/units/:id/comments", (req, res) => {
    const stmt = db.prepare("SELECT * FROM comments WHERE unit_id = ? ORDER BY timestamp ASC");
    res.json(stmt.all(req.params.id));
  });

  app.post("/api/units/:id/comments", (req, res) => {
    const { id, user_id, user_name, content, parent_id } = req.body;
    const stmt = db.prepare(`
      INSERT INTO comments (id, unit_id, user_id, user_name, content, parent_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, req.params.id, user_id, user_name, content, parent_id || null);
    res.status(201).json({ success: true });
  });

  // Search API with Advanced Filters
  app.get("/api/search", (req, res) => {
    const { q, type, author, tag, start, end } = req.query;
    let queryStr = "SELECT * FROM units WHERE (name LIKE ? OR content LIKE ?)";
    const params: any[] = [`%${q || ''}%`, `%${q || ''}%`];

    if (type) {
      queryStr += " AND type = ?";
      params.push(type);
    }
    if (author) {
      queryStr += " AND author_name LIKE ?";
      params.push(`%${author}%`);
    }
    if (tag) {
      queryStr += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
    if (start) {
      queryStr += " AND updated_at >= ?";
      params.push(start);
    }
    if (end) {
      queryStr += " AND updated_at <= ?";
      params.push(end);
    }

    const stmt = db.prepare(queryStr);
    const results = stmt.all(...params);
    res.json(results.map((u: any) => ({ ...u, tags: JSON.parse(u.tags || "[]") })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[OmniBase] System operational on http://localhost:${PORT}`);
  });
}

startServer();
