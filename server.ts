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
  app.get("/api/units", async (req, res) => {
    try {
      const parentId = req.query.parentId as string || null;
      const query = parentId 
        ? "SELECT * FROM units WHERE parent_id = $1"
        : "SELECT * FROM units WHERE parent_id IS NULL";
      const params = parentId ? [parentId] : [];
      
      const result = await pool.query(query, params);
      const units = result.rows.map((u: any) => ({ ...u, tags: JSON.parse(u.tags || "[]") }));
      res.json(units);
    } catch (err) {
      console.error("Error fetching units:", err);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.get("/api/units/:id", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM units WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      const unit = result.rows[0];
      unit.tags = JSON.parse(unit.tags || "[]");
      res.json(unit);
    } catch (err) {
      console.error("Error fetching unit:", err);
      res.status(500).json({ error: "Failed to fetch unit" });
    }
  });

  app.post("/api/units", async (req, res) => {
    try {
      const { id, name, type, parent_id, content, tags, author_id, author_name } = req.body;
      
      await pool.query(
        `INSERT INTO units (id, name, type, parent_id, content, tags, author_id, author_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, name, type, parent_id, content, JSON.stringify(tags || []), author_id, author_name]
      );
      
      const vId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO versions (id, unit_id, version_number, content, author_id, author_name, change_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [vId, id, 1, content, author_id, author_name, "Initial version"]
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Error creating unit:", err);
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  // Update & Versioning
  app.patch("/api/units/:id", async (req, res) => {
    try {
      const { content, author_id, author_name, change_summary } = req.body;
      
      const unitResult = await pool.query("SELECT version_count FROM units WHERE id = $1", [req.params.id]);
      if (unitResult.rows.length === 0) {
        return res.status(404).json({ error: "Unit not found" });
      }
      
      const nextVersion = (unitResult.rows[0].version_count || 0) + 1;

      await pool.query(
        "UPDATE units SET content = $1, version_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        [content, nextVersion, req.params.id]
      );

      const vId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO versions (id, unit_id, version_number, content, author_id, author_name, change_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [vId, req.params.id, nextVersion, content, author_id, author_name, change_summary]
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating unit:", err);
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  // Versions API
  app.get("/api/units/:id/versions", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM versions WHERE unit_id = $1 ORDER BY version_number DESC",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching versions:", err);
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  // Comments API
  app.get("/api/units/:id/comments", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM comments WHERE unit_id = $1 ORDER BY timestamp ASC",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/units/:id/comments", async (req, res) => {
    try {
      const { id, user_id, user_name, content, parent_id } = req.body;
      await pool.query(
        `INSERT INTO comments (id, unit_id, user_id, user_name, content, parent_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, req.params.id, user_id, user_name, content, parent_id || null]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Error creating comment:", err);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Search API with Advanced Filters
  app.get("/api/search", async (req, res) => {
    try {
      const { q, type, author, tag, start, end } = req.query;
      let queryStr = "SELECT * FROM units WHERE (name ILIKE $1 OR content ILIKE $2)";
      const params: any[] = [`%${q || ''}%`, `%${q || ''}%`];
      let paramCount = 2;

      if (type) {
        paramCount++;
        queryStr += ` AND type = $${paramCount}`;
        params.push(type);
      }
      if (author) {
        paramCount++;
        queryStr += ` AND author_name ILIKE $${paramCount}`;
        params.push(`%${author}%`);
      }
      if (tag) {
        paramCount++;
        queryStr += ` AND tags ILIKE $${paramCount}`;
        params.push(`%${tag}%`);
      }
      if (start) {
        paramCount++;
        queryStr += ` AND updated_at >= $${paramCount}`;
        params.push(start);
      }
      if (end) {
        paramCount++;
        queryStr += ` AND updated_at <= $${paramCount}`;
        params.push(end);
      }

      const result = await pool.query(queryStr, params);
      const results = result.rows.map((u: any) => ({ ...u, tags: JSON.parse(u.tags || "[]") }));
      res.json(results);
    } catch (err) {
      console.error("Error searching:", err);
      res.status(500).json({ error: "Failed to search" });
    }
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
    console.log(`\n[OmniBase] System operational on http://localhost:${PORT}`);
    console.log(`[OmniBase] Database: ${process.env.DB_NAME || 'omnibase'} @ ${process.env.DB_HOST || 'localhost'}`);
    console.log(`[OmniBase] Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[OmniBase] Shutting down gracefully...');
    await pool.end();
    process.exit(0);
  });
}

startServer().catch(err => {
  console.error('[OmniBase] Failed to start server:', err);
  process.exit(1);
});
