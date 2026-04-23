# OmniBase - PostgreSQL Server Startup Guide

## ✅ Build Complete
The application has been rebuilt with PostgreSQL async/await API routes fixed.

---

## 🚀 CRITICAL: Database Setup Required Before Starting

### Step 1: Verify PostgreSQL is Running
```bash
# Windows - Check if PostgreSQL service is running
Get-Service postgresql*

# Or use pgAdmin to verify connection
```

### Step 2: Create the Database
```bash
# Connect to PostgreSQL and create database
psql -U postgres -h localhost

# In psql console:
CREATE DATABASE omnibase;
\q

# Verify creation:
psql -U postgres -h localhost -l
```

### Step 3: Verify .env Configuration
The `.env` file in your project root must contain:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=NatEvan12!!
DB_NAME=omnibase
PORT=3000
NODE_ENV=development
```

---

## 🚨 Common Startup Errors & Fixes

### Error: "Cannot connect to database" / "Connection refused"
**Problem**: PostgreSQL is not running or database doesn't exist

**Fix**:
```bash
# 1. Check PostgreSQL service
sc query postgresql-x64-15

# 2. If not running, start it:
net start postgresql-x64-15

# 3. Verify database exists:
psql -U postgres -h localhost -c "\l"

# 4. If omnibase database doesn't exist, create it:
psql -U postgres -h localhost -c "CREATE DATABASE omnibase;"
```

### Error: "password authentication failed"
**Problem**: Wrong password in .env file

**Fix**:
- Verify password in .env matches PostgreSQL password
- Check user is `postgres` (default admin)
- May need to reset PostgreSQL password

### Error: "EADDRINUSE: address already in use :::3000"
**Problem**: Port 3000 already in use by another process

**Fix**:
```bash
# Find process using port 3000:
netstat -ano | findstr :3000

# Kill the process:
taskkill /PID <PID> /F

# Or change PORT in .env to different number like 3001
```

### Error: "connect ECONNREFUSED 127.0.0.1:3000"
**Problem**: Server is not running

**Fix**: Start the server with `npm run dev`

---

## ✅ Startup Verification Steps

### 1. Start the Development Server
```bash
npm run dev
```

**Expected output in terminal:**
```
[OmniBase] Database tables initialized successfully
[OmniBase] System operational on http://localhost:3000
[OmniBase] Database: omnibase @ localhost
[OmniBase] Environment: development

  VITE v6.4.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### 2. Test Backend API
```bash
# In another terminal, test the health endpoint:
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","engine":"OmniBase Core v1.1.0"}
```

### 3. Test Frontend
Open your browser to: `http://localhost:3000`

**Expected behavior**:
- Landing page loads with "OmniBase" branding
- Can click "Terminal Access" to go to dashboard
- No connection errors in browser console

### 4. Test Explorer
Navigate to Knowledge Explorer in sidebar:
- Should show "Initializing Hierarchy..." while loading
- Then show either empty (if no data) or data from database
- No "ERR_CONNECTION_REFUSED" errors

### 5. Test Search
Try searching for something:
- Search should work (return empty or results)
- No "500 Internal Server Error" responses

---

## 🔧 What Was Fixed

### API Routes - Now Async/Await for PostgreSQL
**Before** (SQLite synchronous):
```typescript
app.get("/api/units", (req, res) => {
  const stmt = db.prepare("SELECT ...");
  const units = stmt.all();
  res.json(units);
});
```

**After** (PostgreSQL asynchronous):
```typescript
app.get("/api/units", async (req, res) => {
  try {
    const result = await pool.query("SELECT ...");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});
```

### Parameterized Queries
- Using PostgreSQL parameters: `$1, $2` instead of `?`
- Using `ILIKE` for case-insensitive search instead of `LIKE`

### Dashboard Chart Dimensions
- Added explicit height prop: `height={320}`
- Added minWidth to ResponsiveContainer
- Changed container from `h-[320px]` to `flex-1 min-h-[320px]`

### Server Logging
- Added database connection info on startup
- Added graceful shutdown handling
- Better error messages

---

## 📊 Files Modified in This Fix

| File | Changes |
|------|---------|
| `server.ts` | All API routes converted to async/await for PostgreSQL |
| `src/pages/Dashboard.tsx` | Fixed chart container sizing |

---

## 🎯 Troubleshooting Flowchart

```
Application won't start?
├─ Check PostgreSQL is running
├─ Check omnibase database exists
├─ Check .env file with correct credentials
├─ Check port 3000 is not in use
└─ Check server logs for error messages

API returns 500 error?
├─ Check server console for SQL errors
├─ Check database query parameters
├─ Check that tables were created
└─ Check database credentials in .env

Frontend shows connection refused?
├─ Check backend server is running (`npm run dev`)
├─ Check port 3000 is correct
├─ Check no firewall blocking localhost:3000
└─ Check browser console for full error

Chart showing warnings?
├─ This is fixed - chart now has proper dimensions
└─ Warnings should not appear in new build

Search returning errors?
├─ Check database connection
├─ Check search query is valid
├─ Check API request format
└─ Check server logs for details
```

---

## 🚀 Start the Application

When everything is set up:

```bash
# Terminal 1: Start the dev server
npm run dev

# This will:
# 1. Create/verify database tables
# 2. Start Express backend on port 3000
# 3. Start Vite dev server on port 5173
# 4. Wait for requests
```

**You should see:**
- No error messages about database connection
- No 500 errors when loading pages
- Frontend loads successfully at http://localhost:3000
- API endpoints respond with data (or empty arrays if no data)

---

## 💡 Quick Checklist

Before running, verify:
- [ ] PostgreSQL is installed and running
- [ ] `omnibase` database exists
- [ ] `.env` file exists with PostgreSQL credentials
- [ ] Node dependencies installed (`npm install`)
- [ ] Build successful (`npm run build`)
- [ ] No syntax errors in code
- [ ] Port 3000 is available

Then:
- [ ] Run `npm run dev`
- [ ] Check for "[OmniBase] System operational" message
- [ ] Open http://localhost:3000 in browser
- [ ] Verify no console errors
- [ ] Try navigating around the app

---

**Status: ✅ Ready to run - Just ensure PostgreSQL is set up**

All backend code has been fixed for async PostgreSQL operations.
The application should now start successfully with proper database connectivity.
