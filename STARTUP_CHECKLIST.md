# 🚀 OmniBase - Startup Checklist

## Before You Run `npm run dev`

Copy and use this checklist to ensure everything is ready:

### ✓ Infrastructure

- [ ] **PostgreSQL Installed**
  - Verify: `psql --version`
  - Should output: `psql (PostgreSQL) X.X.X`

- [ ] **PostgreSQL Service Running**
  - Windows: `Get-Service postgresql*` should show "Running"
  - Or: Check Services app for PostgreSQL service

- [ ] **Database Created**
  ```bash
  psql -U postgres -h localhost
  CREATE DATABASE omnibase;
  \l  # Verify omnibase appears in list
  \q
  ```

- [ ] **Port 5432 Available**
  - Default PostgreSQL port
  - Verify: `netstat -ano | findstr :5432`
  - Should show PostgreSQL listening

### ✓ Project Setup

- [ ] **Node.js Installed**
  - Verify: `node --version` (18+ recommended)
  - Verify: `npm --version`

- [ ] **Dependencies Installed**
  ```bash
  npm install
  # Should see: "added XXX packages"
  ```

- [ ] **.env File Created** (in project root)
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=NatEvan12!!
  DB_NAME=omnibase
  PORT=3000
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:5173
  ```

- [ ] **Build Successful**
  ```bash
  npm run build
  # Should see: "✓ built in X.XXs"
  # No "error" messages
  ```

- [ ] **Port 3000 Available**
  - Verify: `netstat -ano | findstr :3000`
  - Should show nothing (port free)
  - If in use: Either stop that process or change PORT in .env

### ✓ Code Quality

- [ ] **No TypeScript Errors**
  - Check: `server.ts` has proper async/await syntax
  - Check: All API routes use `async (req, res) =>`
  - Check: All queries use `await pool.query()`

- [ ] **Imports Updated**
  - Layout.tsx uses `basicSearch` (not `semanticSearch`)
  - No `@google/genai` imports anywhere
  - No `better-sqlite3` imports anywhere

- [ ] **Environment Clean**
  - No debug breakpoints left in code
  - Console.logs okay for debugging
  - No commented-out large blocks

---

## 🎯 Startup Process (Step by Step)

### Step 1: Terminal Setup
```bash
# Open PowerShell or Command Prompt
# Navigate to project:
cd "c:\Users\pyres\OneDrive\Desktop\omnibase\omnibase"

# Verify you're in right location:
ls  # Should show: server.ts, package.json, etc.
```

### Step 2: Start the Server
```bash
npm run dev
```

### Step 3: Watch for Startup Messages

**You should see:**
```
[OmniBase] Database tables initialized successfully
[OmniBase] System operational on http://localhost:3000
[OmniBase] Database: omnibase @ localhost
[OmniBase] Environment: development

  VITE v6.4.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**✅ If you see this**: Everything is working! Go to Step 4.

**❌ If you see errors**: See "Troubleshooting Errors" section below.

### Step 4: Open in Browser
```
http://localhost:3000
```

**Expected**: Landing page loads with OmniBase branding

### Step 5: Test Features

- [ ] Click "Terminal Access" button → Dashboard loads
- [ ] Click "Knowledge Explorer" in sidebar → Explorer loads
- [ ] Try searching for something → Search works (returns results or empty)
- [ ] Check browser console → No red errors
- [ ] Check server terminal → No error messages

**✅ All working?** Your OmniBase PostgreSQL app is ready!

---

## 🚨 Troubleshooting Errors

### Error: `Cannot connect to database` / `ECONNREFUSED`

**Problem**: PostgreSQL not running

**Fix**:
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-15

# Verify it's running:
Get-Service postgresql* | Select-Object Name, Status

# Then try npm run dev again
```

---

### Error: `database "omnibase" does not exist`

**Problem**: Database not created

**Fix**:
```bash
# Create the database
psql -U postgres -h localhost -c "CREATE DATABASE omnibase;"

# Verify it exists:
psql -U postgres -h localhost -c "\l"

# Then try npm run dev again
```

---

### Error: `password authentication failed for user "postgres"`

**Problem**: Wrong password in .env or PostgreSQL

**Fix Option 1: Check .env**
- Verify .env has correct password: `NatEvan12!!`
- Restart server: `npm run dev`

**Fix Option 2: Reset PostgreSQL password**
```bash
# In psql:
\password postgres
# Enter new password (use: NatEvan12!!)
# Update .env with new password
# Restart server
```

---

### Error: `EADDRINUSE: address already in use :::3000`

**Problem**: Another process using port 3000

**Fix Option 1: Stop other process**
```bash
# Find process on port 3000:
netstat -ano | findstr :3000

# Note the PID, then kill it:
taskkill /PID <PID> /F

# Retry npm run dev
```

**Fix Option 2: Use different port**
```bash
# Edit .env:
PORT=3001  # Changed from 3000

# Restart: npm run dev
# Access: http://localhost:3001
```

---

### Error: `connect ECONNREFUSED 127.0.0.1:3000` in browser

**Problem**: Server isn't running

**Fix**:
- Make sure terminal shows "[OmniBase] System operational..."
- If not, start it: `npm run dev`
- Wait for server to fully start (3-5 seconds)
- Refresh browser (Ctrl+R or Cmd+R)

---

### Error: `ReferenceError: semanticSearch is not defined`

**Problem**: Old import still in code

**Fix**:
- Search for `semanticSearch` in all files
- Replace with `basicSearch`
- Rebuild: `npm run build`
- Restart: `npm run dev`

---

### Error: `Cannot find module better-sqlite3`

**Problem**: Old dependency still referenced

**Fix**:
- Search code for `better-sqlite3` or `require("better-sqlite3")`
- Should not exist in current code
- Reinstall dependencies: `npm install`
- Restart: `npm run dev`

---

### Error: Recharts warning about chart dimensions

**Problem**: Chart container sizing issue

**Fix**: ✅ Already fixed in this version
- Dashboard.tsx now has proper height configuration
- Warnings should not appear
- If they do: Check that you're using latest Dashboard.tsx

---

### Error: API returns `500 Internal Server Error`

**Problem**: Database query failed

**Fix**:
1. **Check server console** for error message
   - Look at terminal running `npm run dev`
   - Error details should be printed

2. **Common causes**:
   - Table doesn't exist (check table creation logged)
   - Query syntax error (check PostgreSQL syntax)
   - Connection pool issue (check PostgreSQL running)

3. **Debug**:
   ```bash
   # Try connecting directly to database:
   psql -U postgres -h localhost -d omnibase
   \dt  # List tables - should show: units, versions, comments
   SELECT COUNT(*) FROM units;  # Should return 0 or data
   \q
   ```

---

### Error: `Error: connect ECONNREFUSED at TCPConnectWrap.afterConnect`

**Problem**: Can't connect to PostgreSQL

**Fix**:
1. Verify PostgreSQL service is running
2. Verify database exists: `psql -U postgres -h localhost -l`
3. Verify credentials in .env are correct
4. Try connecting manually: `psql -U postgres -h localhost`
5. If manual connection fails, PostgreSQL setup is issue

---

## 📊 Health Check Commands

Use these to verify system state:

```bash
# Check PostgreSQL service
Get-Service postgresql* | Select-Object Name, Status

# Check PostgreSQL connectivity
psql -U postgres -h localhost -c "SELECT 1;"
# Response should be: 1 (single row)

# Check database exists
psql -U postgres -h localhost -c "\l"
# Should show: omnibase database in list

# Check port 3000 free
netstat -ano | findstr :3000
# Should return nothing

# Check port 5432 (PostgreSQL) in use
netstat -ano | findstr :5432
# Should show: LISTENING

# Verify .env file exists
Test-Path .env
# Response should be: True

# Verify dependencies installed
Test-Path node_modules
# Response should be: True
```

---

## 📝 Quick Reference

| Command | Purpose | Expected Output |
|---------|---------|-----------------|
| `npm run dev` | Start dev server | `System operational on http://localhost:3000` |
| `npm run build` | Build production | `✓ built in X.XXs` |
| `npm install` | Install dependencies | `added XXX packages` |
| `psql -U postgres` | Connect to PostgreSQL | `postgres=#` prompt |

---

## ✅ Success Criteria

Server is working correctly when:

✅ `npm run dev` completes without errors
✅ Terminal shows "[OmniBase] System operational"
✅ Browser opens to http://localhost:3000
✅ Landing page displays
✅ No "ERR_CONNECTION_REFUSED" in browser console
✅ No "500 Internal Server Error" in network tab
✅ Dashboard shows data (or empty state if no data)
✅ Search functionality works
✅ WebSocket status shows "Connected"

---

## 🎯 If Everything Works

Congratulations! Your OmniBase PostgreSQL application is running successfully.

**Your application now has:**
- ✅ PostgreSQL backend (no more SQLite)
- ✅ Async/await API routes
- ✅ Real-time collaboration with WebSocket
- ✅ Knowledge base management
- ✅ Search functionality
- ✅ Comment system

**Next, you might want to:**
1. Add sample data to the database
2. Test all features thoroughly
3. Consider user authentication
4. Deploy to a server (Azure, Heroku, etc.)

---

## 🆘 Still Having Issues?

1. **Check TROUBLESHOOTING.md** - More detailed explanations
2. **Check PROJECT_COMPLETION.md** - Full architecture overview
3. **Check server.ts** - Review error handling
4. **Check .env** - Verify all credentials
5. **Check PostgreSQL logs** - Find root cause errors

---

**Version**: 1.0 (Post PostgreSQL Migration)
**Last Updated**: After successful build
**Status**: ✅ Ready to run
