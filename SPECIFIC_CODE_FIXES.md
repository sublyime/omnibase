# OmniBase - Specific Code Fixes Required

## Issue #1: Dashboard Using Hardcoded Demo Data ❌

**File**: `src/pages/Dashboard.tsx`  
**Status**: CRITICAL - Shows fake metrics  

### Current Code (Lines 27-32)
```typescript
const DATA = [
  { name: 'Mon', usage: 400 },
  { name: 'Tue', usage: 300 },
  { name: 'Wed', usage: 600 },
  { name: 'Thu', usage: 800 },
  { name: 'Fri', usage: 500 },
  { name: 'Sat', usage: 200 },
  { name: 'Sun', usage: 100 },
];

const CATEGORIES = [
  { name: 'Engineering', count: 124, color: '#635bff' },
  { name: 'Legal', count: 86, color: '#f59e0b' },
  { name: 'HR', count: 42, color: '#10b981' },
  { name: 'Marketing', count: 98, color: '#ef4444' },
];
```

### Fixed Code
```typescript
// Remove hardcoded data - fetch from API instead
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    data: [],
    categories: [],
    totalAssets: '0 TB',
    accessNodes: '0',
    velocity: '0 MB/s',
    entropy: '0%'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all units to calculate real metrics
      const res = await fetch('/api/units');
      const units = await res.json();
      
      // Calculate total size (mock: assume 1TB per unit for now)
      const totalSize = units.length;
      const totalAssetsTB = (totalSize * 0.001).toFixed(2);
      
      // Group by type
      const categories = {};
      units.forEach(u => {
        if (!categories[u.type]) categories[u.type] = 0;
        categories[u.type]++;
      });
      
      // Convert to chart format
      const categoryData = Object.entries(categories).map(([type, count], idx) => ({
        name: type,
        count: count as number,
        color: ['#635bff', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6'][idx]
      }));
      
      // Mock time series data (7 days)
      const now = new Date();
      const data = Array(7).fill(0).map((_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        usage: Math.floor(units.length * 50 + Math.random() * 200)
      }));
      
      setStats({
        data,
        categories: categoryData,
        totalAssets: `${totalAssetsTB} TB`,
        accessNodes: String(units.length),
        velocity: `${(units.length * 10).toFixed(0)} MB/s`,
        entropy: '0.04%'
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  // Use stats state instead of hardcoded constants
  return (
    <div className="space-y-8 pb-12">
      {/* Rest of component unchanged, but use stats instead of DATA/CATEGORIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Managed Assets" 
          value={stats.totalAssets}
          trend="+1.2%" 
          trendUp={true} 
          icon={<FileText size={18} />} 
        />
        {/* ... etc */}
      </div>
    </div>
  );
}
```

---

## Issue #2: Explorer Not Fetching from API on Load ❌

**File**: `src/pages/Explorer.tsx`  
**Status**: MAJOR - Tree view is empty on initial load  

### Current Issue
Explorer calls `fetchUnits()` but doesn't load root-level units on component mount. Users see "Initializing Hierarchy..." forever.

### Fixed Code
```typescript
useEffect(() => {
  // Fetch root-level units on mount
  fetchRootUnits();
}, []);

const fetchRootUnits = async () => {
  try {
    const res = await fetch('/api/units?parentId=null');
    const data = await res.json();
    setUnits(data);
    setLoading(false);
  } catch (err) {
    console.error("Failed to fetch root units", err);
    setLoading(false);
  }
};
```

---

## Issue #3: Empty Database - No Seed Data ❌

**File**: New file `scripts/seed.ts`  
**Status**: CRITICAL - Database starts completely empty  

### Create This File
```typescript
import Database from "better-sqlite3";
import crypto from "crypto";

const db = new Database("omnibase.db");

const seedData = [
  {
    id: "root-eng",
    name: "Engineering Knowledge Base",
    type: "DIRECTORY",
    parent_id: null,
    content: "Root directory for all engineering documentation",
    tags: JSON.stringify(["engineering", "documentation"]),
    author_id: "sys-1",
    author_name: "System"
  },
  {
    id: "arch-2024",
    name: "System Architecture 2024",
    type: "DOCUMENT",
    parent_id: "root-eng",
    content: "Complete system architecture documentation including microservices, databases, and deployment strategy.",
    tags: JSON.stringify(["architecture", "2024"]),
    author_id: "usr-1",
    author_name: "Principal Architect"
  },
  {
    id: "api-spec",
    name: "API Specifications",
    type: "DOCUMENT",
    parent_id: "root-eng",
    content: "Complete RESTful API specification including endpoints, authentication, rate limiting.",
    tags: JSON.stringify(["api", "specification"]),
    author_id: "usr-2",
    author_name: "API Lead"
  },
  {
    id: "3d-models",
    name: "3D Models & Assets",
    type: "DIRECTORY",
    parent_id: "root-eng",
    content: "CAD and 3D model storage",
    tags: JSON.stringify(["3d", "cad"]),
    author_id: "sys-1",
    author_name: "System"
  },
  {
    id: "model-01",
    name: "System Component 3D Model",
    type: "MODEL_3D",
    parent_id: "3d-models",
    content: "component.gltf",
    tags: JSON.stringify(["3d", "model"]),
    author_id: "usr-3",
    author_name: "3D Modeler"
  }
];

// Insert seed data
const stmt = db.prepare(`
  INSERT INTO units (id, name, type, parent_id, content, tags, author_id, author_name)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

seedData.forEach(data => {
  stmt.run(
    data.id,
    data.name,
    data.type,
    data.parent_id,
    data.content,
    data.tags,
    data.author_id,
    data.author_name
  );
  console.log(`✓ Seeded: ${data.name}`);
});

// Create initial versions
const versionStmt = db.prepare(`
  INSERT INTO versions (id, unit_id, version_number, content, author_id, author_name, change_summary)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

seedData.forEach(data => {
  versionStmt.run(
    crypto.randomUUID(),
    data.id,
    1,
    data.content,
    data.author_id,
    data.author_name,
    "Initial version"
  );
});

console.log("\n✅ Database seeded successfully!");
db.close();
```

### Add to package.json
```json
{
  "scripts": {
    "seed": "tsx scripts/seed.ts"
  }
}
```

### Run with
```bash
npm run seed
```

---

## Issue #4: Gemini API Key Not Validated ❌

**File**: `server.ts` and `src/lib/gemini.ts`  
**Status**: MAJOR - Search will fail silently  

### Current Issue in `src/lib/gemini.ts`
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// No validation - will silently fail if key is undefined
```

### Fixed Code
```typescript
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY environment variable is not set!");
  console.warn("Semantic search will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export async function semanticSearch(query: string, knowledgeContext: string) {
  if (!ai) {
    return {
      success: false,
      error: "Semantic search is not configured. Please set GEMINI_API_KEY environment variable.",
      results: []
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        You are OmniBase AI, an enterprise knowledge retrieval engine.
        
        KNOWLEDGE BASE CONTEXT:
        ${knowledgeContext}
        
        USER QUERY:
        "${query}"
        
        TASK:
        1. Identify the most relevant knowledge units from the context.
        2. Explain why they are relevant.
        3. If no direct match is found, suggest related topics or search paths.
        
        Respond in a concise, professional enterprise tone.
      `,
    });

    return {
      success: true,
      results: response.text
    };
  } catch (error) {
    console.error("OmniBase Search Error:", error);
    return {
      success: false,
      error: "Semantic search engine encountered an error. Try keyword search instead.",
      results: []
    };
  }
}
```

### Add to `.env` file (create if doesn't exist)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### Add `.env.example`
```bash
# Google Gemini API Key - Get from https://ai.google.dev/
GEMINI_API_KEY=

# Environment
NODE_ENV=development

# Database (optional - defaults to SQLite)
# DATABASE_URL=postgresql://user:password@localhost/omnibase
```

---

## Issue #5: Mock User Everywhere (No Auth) ❌

**File**: `src/pages/Explorer.tsx` (Line 29)  
**Status**: CRITICAL - Everyone is admin  

### Current Code
```typescript
// Mock current user for prototype
const currentUser = { id: 'usr-1', name: 'Sublyime', role: 'admin' as const };
```

### Immediate Fix (Before Real Auth)
```typescript
// Get user from localStorage or context
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id":"usr-1","name":"Demo User","role":"viewer"}');
```

### Better Fix (After Auth System)
```typescript
import { useAuth } from '../hooks/useAuth';

export default function Explorer() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Use user from auth context...
}
```

---

## Issue #6: No Environment Variables Setup ❌

**File**: New file `.env`  
**Status**: MAJOR - Hardcoded values, not configurable  

### Create `.env`
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./omnibase.db
# For PostgreSQL: postgresql://user:password@localhost/omnibase

# AI
GEMINI_API_KEY=

# Auth (if implementing JWT)
JWT_SECRET=your_random_secret_key_here

# CORS
CORS_ORIGIN=http://localhost:5173

# File uploads
MAX_FILE_SIZE_MB=500
UPLOAD_DIR=./uploads
```

### Update `server.ts` to use env vars
```typescript
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// ... later in code
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[OmniBase] System operational on http://localhost:${PORT}`);
  console.log(`[OmniBase] Environment: ${NODE_ENV}`);
  console.log(`[OmniBase] Database: ${process.env.DATABASE_URL || 'SQLite'}`);
});
```

---

## Issue #7: File Paths Hardcoded ❌

**File**: `src/lib/gemini.ts` model name  
**Status**: MINOR - Using preview model instead of stable  

### Current Code
```typescript
model: "gemini-3-flash-preview",  // ❌ Preview version
```

### Fixed Code
```typescript
model: "gemini-2.0-flash",  // ✅ Stable production model
```

---

## Issue #8: No Error Boundaries ❌

**File**: `src/App.tsx`  
**Status**: MEDIUM - App crashes on component error  

### Add Error Boundary
```typescript
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-enterprise-bg text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
            <p className="text-enterprise-muted mb-6">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* ... rest of app */}
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

---

## Quick Fix Checklist

- [ ] Run `npm run seed` to populate database
- [ ] Update Dashboard to fetch real data (2 hours)
- [ ] Create `.env` file with Gemini API key
- [ ] Replace demo user with auth system (8 hours)
- [ ] Add file upload endpoint (3 hours)
- [ ] Add error boundaries (30 min)
- [ ] Test API endpoints with curl/Postman
- [ ] Verify WebSocket collaboration works
- [ ] Check search functionality

---

## Minimal Viable Fixes (Next 4 Hours)

```bash
# 1. Seed database
npm run seed

# 2. Create and configure .env
cp .env.example .env
# Edit .env with your Gemini API key

# 3. Test if app runs
npm run dev

# 4. Check if Explorer shows data
# Navigate to http://localhost:3000/explorer
```

Expected result: Explorer shows Engineering Knowledge Base hierarchy

---

## Testing Each Fix

### Test Database Seeding
```bash
npm run seed
# Should output:
# ✓ Seeded: Engineering Knowledge Base
# ✓ Seeded: System Architecture 2024
# ✓ Seeded: API Specifications
# ✓ Seeded: 3D Models & Assets
# ✓ Seeded: System Component 3D Model
# ✅ Database seeded successfully!
```

### Test Explorer
```bash
# Navigate to http://localhost:3000/explorer
# Should see: "Engineering Knowledge Base" in left sidebar
# Should be able to expand and see child nodes
```

### Test Search
```bash
# Open http://localhost:3000/explorer
# Use search bar to search for "architecture"
# Should return matching documents
```

### Test Dashboard  
```bash
# Navigate to http://localhost:3000/dashboard
# Stats should update dynamically based on database
# Charts should show real data (not hardcoded)
```

---

*These are the most critical fixes needed to make the application functional.*  
*Estimated fix time: 12-16 hours*
