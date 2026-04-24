import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import session from "express-session";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

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
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'viewer',
      permissions TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      source_type TEXT NOT NULL,
      file_path TEXT,
      file_size BIGINT,
      file_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      uploaded_by TEXT NOT NULL,
      processing_status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    )`);
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS data_source_files (
      id TEXT PRIMARY KEY,
      data_source_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT,
      file_type TEXT,
      processing_status TEXT DEFAULT 'pending',
      unit_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
      FOREIGN KEY(unit_id) REFERENCES units(id)
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
  
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'omnibase-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const authenticateSession = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
      if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };

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

  // ============= SETUP & INITIALIZATION =============
  
  app.get("/api/setup/status", async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM users');
      const hasUsers = parseInt(result.rows[0].count) > 0;
      res.json({ initialized: hasUsers });
    } catch (err) {
      res.status(500).json({ error: "Failed to check setup status" });
    }
  });

  app.post("/api/setup/init-admin", async (req, res) => {
    try {
      // Check if system is already initialized
      const result = await pool.query('SELECT COUNT(*) as count FROM users');
      if (parseInt(result.rows[0].count) > 0) {
        return res.status(400).json({ error: 'System already initialized' });
      }

      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const userId = crypto.randomUUID();
      
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, name, email, passwordHash, 'admin']
      );
      
      req.session.userId = userId;
      req.session.userRole = 'admin';
      
      res.status(201).json({ 
        success: true, 
        user: { id: userId, name, email, role: 'admin' } 
      });
    } catch (err) {
      console.error("Error initializing admin:", err);
      res.status(500).json({ error: "Failed to initialize admin" });
    }
  });

  // ============= AUTHENTICATION ENDPOINTS =============
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // Hash password (in production, use bcrypt)
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const userId = crypto.randomUUID();
      
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, name, email, passwordHash, role || 'viewer']
      );
      
      req.session.userId = userId;
      req.session.userRole = role || 'viewer';
      
      res.status(201).json({ 
        success: true, 
        user: { id: userId, name, email, role: role || 'viewer' } 
      });
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE email = $1 AND password_hash = $2 AND is_active = true',
        [email, passwordHash]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      res.json({ 
        success: true, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role } 
      });
    } catch (err) {
      console.error("Error logging in:", err);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", authenticateSession, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [req.session.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ============= USER MANAGEMENT ENDPOINTS =============
  
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const userId = crypto.randomUUID();
      
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, name, email, passwordHash, role || 'viewer']
      );
      
      res.status(201).json({ 
        success: true, 
        user: { id: userId, name, email, role: role || 'viewer' } 
      });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { name, email, role, is_active } = req.body;
      const userId = req.params.id;
      
      await pool.query(
        `UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [name, email, role, is_active !== undefined ? is_active : true, userId]
      );
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting the current user
      if (userId === req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete your own user account' });
      }
      
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ============= DATA SOURCES ENDPOINTS =============
  
  app.get("/api/data-sources", authenticateSession, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, description, source_type, file_count, status, processing_status, 
                uploaded_by, created_at, updated_at FROM data_sources ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching data sources:", err);
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });

  app.post("/api/data-sources/upload", authenticateSession, upload.array('files'), async (req, res) => {
    try {
      const { name, description, sourceType } = req.body;
      const files = req.files as any[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }
      
      const dataSourceId = crypto.randomUUID();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Create data source record
      await pool.query(
        `INSERT INTO data_sources (id, name, description, source_type, file_count, file_size, uploaded_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [dataSourceId, name, description, sourceType || 'file', files.length, totalSize, req.session.userId, 'uploaded']
      );
      
      // Create file records
      for (const file of files) {
        const fileId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO data_source_files (id, data_source_id, file_name, file_path, file_size, file_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [fileId, dataSourceId, file.originalname, file.path, file.size, file.mimetype]
        );
      }
      
      res.status(201).json({ 
        success: true, 
        dataSourceId,
        message: `${files.length} file(s) uploaded successfully`
      });
    } catch (err) {
      console.error("Error uploading files:", err);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.get("/api/data-sources/:id", authenticateSession, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM data_sources WHERE id = $1',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      const dataSource = result.rows[0];
      
      // Get associated files
      const filesResult = await pool.query(
        'SELECT id, file_name, file_size, file_type, processing_status, created_at FROM data_source_files WHERE data_source_id = $1',
        [req.params.id]
      );
      
      dataSource.files = filesResult.rows;
      res.json(dataSource);
    } catch (err) {
      console.error("Error fetching data source:", err);
      res.status(500).json({ error: "Failed to fetch data source" });
    }
  });

  app.delete("/api/data-sources/:id", requireAdmin, async (req, res) => {
    try {
      const dataSourceId = req.params.id;
      
      // Get file paths to delete
      const filesResult = await pool.query(
        'SELECT file_path FROM data_source_files WHERE data_source_id = $1',
        [dataSourceId]
      );
      
      // Delete files from disk
      for (const file of filesResult.rows) {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      }
      
      // Delete from database (cascade will handle files)
      await pool.query('DELETE FROM data_sources WHERE id = $1', [dataSourceId]);
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting data source:", err);
      res.status(500).json({ error: "Failed to delete data source" });
    }
  });

  // ============= KNOWLEDGE UNITS (existing) ============= 
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
