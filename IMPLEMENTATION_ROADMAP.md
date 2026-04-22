# OmniBase - Implementation Roadmap to Production

## Quick Wins (Can be done immediately)

### 1. Seed Database with Sample Data
```sql
-- Add sample knowledge units
INSERT INTO units (id, name, type, parent_id, content, tags, author_id, author_name)
VALUES 
  ('root-001', 'Knowledge Base', 'DIRECTORY', NULL, 'Root directory', '["enterprise"]', 'sys-1', 'System'),
  ('eng-001', 'Engineering', 'DIRECTORY', 'root-001', 'Technical documentation', '["engineering","technical"]', 'sys-1', 'System'),
  ('doc-001', 'Architecture Guide', 'DOCUMENT', 'eng-001', 'System architecture documentation...', '["architecture","guide"]', 'user-1', 'Architect');
```
**Impact**: Makes Explorer and Dashboard work with real data  
**Effort**: 30 minutes  
**Priority**: CRITICAL

### 2. Connect Dashboard to Real API Data
**Current**: Hardcoded `const DATA = [...]`  
**Fix**: 
- Fetch from `/api/search?q=*` to get all units
- Calculate real stats from database
- Update charts with actual metrics

```typescript
// Replace hardcoded DATA
useEffect(() => {
  fetchRealData();
}, []);

const fetchRealData = async () => {
  const res = await fetch('/api/units');
  const units = await res.json();
  
  // Calculate real metrics
  const totalAssets = units.reduce((sum, u) => sum + (u.size || 1), 0);
  const byType = groupBy(units, 'type');
  // ... etc
};
```

**Impact**: Dashboard shows real data instead of fake stats  
**Effort**: 1-2 hours  
**Priority**: HIGH

### 3. Add Database Seeding Script
**Create**: `scripts/seed.ts`
- Create sample hierarchy
- Add test documents
- Initialize default admin user

**Impact**: New deployments start with sample data  
**Effort**: 1 hour  
**Priority**: HIGH

### 4. Fix Environment Variable Handling
**Issue**: Gemini API key and database URL hardcoded  
**Fix**:
- Create `.env.example`
- Update `server.ts` to read from env
- Add env validation on startup

```typescript
// server.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set. Semantic search will fail.");
}
```

**Impact**: Configurable deployment  
**Effort**: 30 minutes  
**Priority**: MEDIUM

---

## Phase 1: Make It Actually Functional (Week 1)

### 5. Implement Basic Authentication
**Option A: Simple JWT (Fastest)**
- Create login endpoint
- Generate JWT tokens
- Protect routes with middleware
- Store user in session

**Option B: OAuth (Better)**
- Add Google OAuth
- Add GitHub OAuth
- Redirect flow

```typescript
// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Validate...
  const token = jwt.sign({ userId: user.id }, SECRET);
  res.json({ token, user });
});

// Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Verify...
  next();
}
```

**Impact**: System is no longer completely open  
**Effort**: 2-3 hours  
**Priority**: CRITICAL

### 6. Add File Upload Endpoint
```typescript
// POST /api/units/:id/upload
app.post('/api/units/:id/upload', upload.single('file'), (req, res) => {
  const { file } = req;
  const { name, tags } = req.body;
  
  // Save file
  const filePath = path.join(UPLOAD_DIR, file.filename);
  
  // Create unit record
  const unitId = req.params.id;
  db.prepare(`
    UPDATE units SET 
      content = ?, 
      metadata = JSON_SET(metadata, '$.file_path', ?)
    WHERE id = ?
  `).run(file.filename, filePath, unitId);
  
  res.json({ success: true, filePath });
});
```

**Requires**: Express multer package  
**Impact**: Can now upload files  
**Effort**: 2 hours  
**Priority**: CRITICAL

### 7. Create Basic File Preview System
```typescript
// GET /api/files/:fileId/preview
app.get('/api/files/:fileId/preview', (req, res) => {
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.fileId);
  
  if (unit.type === 'DOCUMENT' && unit.content.endsWith('.pdf')) {
    // Use pdf-parse to extract text/metadata
    return res.json({ type: 'pdf', preview: extractedText });
  }
  
  if (unit.type === 'MEDIA' && unit.content.endsWith('.mp4')) {
    // Return video metadata
    return res.json({ type: 'video', url: `/files/${unit.id}` });
  }
  
  // Fallback: return metadata
  res.json({ type: 'file', name: unit.name });
});
```

**Requires**: pdf-parse, sharp (image thumbnails)  
**Impact**: Can preview some file types  
**Effort**: 2-3 hours  
**Priority**: HIGH

### 8. Implement Basic RBAC
```typescript
// Types of users
enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor', 
  VIEWER = 'viewer'
}

// Permissions
const PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'admin'],
  editor: ['create', 'read', 'update'],
  viewer: ['read']
};

// Middleware
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user; // From JWT
    if (!PERMISSIONS[user.role].includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.delete('/api/units/:id', requirePermission('delete'), (req, res) => {
  // Delete...
});
```

**Impact**: Can control who does what  
**Effort**: 2-3 hours  
**Priority**: HIGH

---

## Phase 2: Enterprise Features (Week 2-3)

### 9. PostgreSQL Support
**Create**: Database abstraction layer
```typescript
// lib/database.ts
interface Database {
  prepare(sql: string): any;
  exec(sql: string): void;
  transaction(fn: Function): void;
}

// SQLiteDB
class SQLiteDB implements Database { ... }

// PostgresDB  
class PostgresDB implements Database { ... }

// Factory
const db = process.env.DB_TYPE === 'postgres' 
  ? new PostgresDB(process.env.DATABASE_URL)
  : new SQLiteDB('omnibase.db');
```

**Requires**: pg (PostgreSQL driver)  
**Impact**: Can use PostgreSQL for production  
**Effort**: 4-6 hours  
**Priority**: MEDIUM (needed for enterprise)

### 10. Add Real File Type Handlers
```typescript
// lib/fileHandlers.ts
export const fileHandlers = {
  pdf: {
    extract: (buffer) => pdfParse(buffer).then(pdf => pdf.text),
    preview: (buffer) => generatePdfThumbnail(buffer)
  },
  docx: {
    extract: (buffer) => mammoth.extractRawText({ arrayBuffer: buffer }),
    preview: (buffer) => generateDocxPreview(buffer)
  },
  xlsx: {
    extract: (buffer) => XLSX.read(buffer),
    preview: (buffer) => generateSpreadsheetPreview(buffer)
  },
  image: {
    extract: () => extractImageMetadata(),
    preview: (buffer) => sharp(buffer).resize(200, 200).toBuffer()
  }
};
```

**Requires**: pdf-parse, mammoth, xlsx, sharp  
**Impact**: Real file processing  
**Effort**: 8-10 hours  
**Priority**: HIGH

### 11. Implement Encryption
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.scryptSync(process.env.MASTER_KEY, 'salt', 32);

export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptData(encrypted: string): string {
  const [iv, authTag, data] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    ENCRYPTION_KEY, 
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Impact**: Data encrypted at rest  
**Effort**: 2-3 hours  
**Priority**: HIGH (for FedRAMP)

### 12. Add Audit Logging
```typescript
// Create audit_logs table
db.exec(`
  CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    changes JSONB,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Middleware to log actions
function auditLog(action: string) {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, timestamp, ip_address)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).run(
        crypto.randomUUID(),
        req.user?.id,
        action,
        'unit',
        req.ip
      );
      return originalJson.call(this, data);
    };
    next();
  };
}
```

**Impact**: Full audit trail for compliance  
**Effort**: 2-3 hours  
**Priority**: HIGH (for FedRAMP)

---

## Phase 3: Advanced Features (Week 3-4)

### 13. Wire Gemini Search Properly
```typescript
// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

const api = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function semanticSearch(query: string, units: KnowledgeUnit[]) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  
  const context = units
    .map(u => `${u.name} (${u.type}): ${u.content?.slice(0, 200) || 'N/A'}`)
    .join('\n');
  
  const response = await api.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      role: 'user',
      parts: [{
        text: `Search context:\n${context}\n\nQuery: ${query}`
      }]
    }
  });
  
  return response.text;
}
```

**Requires**: Valid Gemini API key  
**Impact**: Semantic search actually works  
**Effort**: 1 hour  
**Priority**: MEDIUM

### 14. Add 2FA Support
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate 2FA secret
app.post('/api/auth/2fa/setup', (req, res) => {
  const user = req.user;
  const secret = speakeasy.generateSecret({
    name: `OmniBase (${user.email})`
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  db.prepare(`
    UPDATE users SET mfa_secret = ? WHERE id = ?
  `).run(secret.base32, user.id);
  
  res.json({ qrCode, secret: secret.base32 });
});

// Verify 2FA token
app.post('/api/auth/2fa/verify', (req, res) => {
  const { token } = req.body;
  const user = req.user;
  
  const verified = speakeasy.totp.verify({
    secret: user.mfa_secret,
    encoding: 'base32',
    token,
    window: 2
  });
  
  if (verified) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

**Requires**: speakeasy, qrcode packages  
**Impact**: 2FA actually works  
**Effort**: 2-3 hours  
**Priority**: MEDIUM

---

## Priority Matrix

| Feature | Effort | Impact | Priority | Owner |
|---------|--------|--------|----------|-------|
| Database seeding | 1h | HIGH | **P0** | Backend |
| Dashboard → API | 2h | HIGH | **P0** | Frontend |
| Basic Auth | 3h | CRITICAL | **P0** | Backend |
| File upload | 2h | CRITICAL | **P0** | Backend |
| File preview | 3h | HIGH | **P1** | Backend |
| RBAC | 3h | HIGH | **P1** | Backend |
| PostgreSQL | 6h | MEDIUM | **P1** | Backend |
| File handlers | 10h | HIGH | **P2** | Backend |
| Encryption | 3h | HIGH | **P2** | Backend |
| Audit logging | 3h | HIGH | **P2** | Backend |
| Gemini fix | 1h | MEDIUM | **P2** | Frontend |
| 2FA | 3h | MEDIUM | **P2** | Backend |

---

## Testing Strategy

### Unit Tests
```bash
npm install --save-dev vitest @testing-library/react
npm run test
```

### Integration Tests  
```bash
# Test API endpoints
npm run test:api

# Test WebSocket collaboration
npm run test:collaboration

# Test file upload/processing
npm run test:files
```

### Security Tests
```bash
# SQL injection
# XSS attacks
# CSRF protection
# File upload validation
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated (PostgreSQL for production)
- [ ] SSL certificates installed
- [ ] API keys (Gemini) configured
- [ ] Auth system tested
- [ ] File uploads tested
- [ ] Backups configured
- [ ] Monitoring/logging set up
- [ ] Audit logs enabled
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] Health check endpoint working

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 5-7 days | Functional MVP (Auth, files, basic features) |
| **Phase 2** | 7-10 days | Enterprise-ready (PostgreSQL, RBAC, encryption) |
| **Phase 3** | 5-7 days | Advanced features (2FA, audit, compliance) |
| **Testing** | 3-5 days | Full QA and security testing |
| **Deployment** | 1-2 days | Production launch |
| **TOTAL** | 3-4 weeks | Production-ready enterprise system |

---

## Success Criteria

✅ All users require authentication  
✅ Dashboard shows real data from database  
✅ Can upload and preview files  
✅ Semantic search works  
✅ Version history functional  
✅ Comments real-time sync working  
✅ PostgreSQL support available  
✅ Full RBAC enforcement  
✅ Audit logs captured  
✅ Basic encryption enabled  
✅ 2FA working  
✅ Zero hardcoded demo data  
✅ All tests passing  
✅ Zero security warnings from npm audit  

---

*Roadmap Version: 1.0*  
*Last Updated: 2026-04-22*
