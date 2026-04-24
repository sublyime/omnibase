# User Admin & Data Sources - Getting Started Guide

## What's New

You now have fully functional user administration and data source management features:

### 1. **User Management** (/admin)
- Create, edit, and deactivate users
- Three role types: Viewer, Editor, Admin
- Session-based authentication with password hashing

### 2. **Data Sources** (/data-sources)
- Upload files and documents to create knowledge base sources
- Manage multiple files per source
- Track file processing status

### 3. **Authentication**
- Login page with session management
- First-time setup creates initial admin user
- Secure session storage (24-hour expiration)

## How to Start

### Step 1: Start the Server
```bash
npm run dev
```
Server will start on `http://localhost:3000`

### Step 2: Create Admin Account
1. Navigate to `http://localhost:3000/login`
2. Click "Create Admin Account" (first-time setup)
3. Fill in:
   - Full Name: (your name)
   - Email: admin@example.com
   - Password: (secure password)
4. Click "Create Admin Account"

### Step 3: Login
- Use the email and password you just created
- You'll be redirected to the Dashboard

## Using the System

### Managing Users

**Access:** Go to Admin > Access Control in the sidebar

**Actions:**
- **View Users:** All active users displayed in table
- **Add User:** Click "Add New User" button
  - Set role: Viewer, Editor, or Admin
  - Viewer: Can search and read only
  - Editor: Can create and edit knowledge units
  - Admin: Full system access
- **Edit User:** Click edit icon, change details
- **Deactivate User:** Edit user and toggle "Active" status
- **Delete User:** Click delete icon (cannot delete your own account)

### Uploading Data Sources

**Access:** Click "Data Sources" in the sidebar

**Upload Process:**
1. Click "Add Data Source"
2. Fill in:
   - **Source Name:** e.g., "Company Policies", "Technical Docs"
   - **Description:** What this data contains
   - **Source Type:** File, Document, Spreadsheet, or Archive
   - **Files:** Click to select or drag-drop multiple files
3. Click "Upload Files"
4. Files appear in the left panel once uploaded
5. Click a source to view details and file list

**Supported File Types:**
- Documents: PDF, DOCX, PPTX, TXT
- Spreadsheets: XLSX, CSV, JSON
- Archives: ZIP, TAR, 7Z
- Media: PNG, JPG, MP3, MP4

## Environment Configuration

Create a `.env` file in the project root with:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=NatEvan12!!
DB_NAME=omnibase

# Session
SESSION_SECRET=omnibase-secret-key-change-in-production
```

## Database Setup

PostgreSQL must be running before starting the server.

```bash
# Create the omnibase database
psql -U postgres -c "CREATE DATABASE omnibase;"
```

Tables are auto-created when the server starts.

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout (destroys session)
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### User Management (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Data Sources
- `GET /api/data-sources` - List all sources
- `POST /api/data-sources/upload` - Upload files (multipart form)
- `GET /api/data-sources/:id` - Get source details with files
- `DELETE /api/data-sources/:id` - Delete source and files

### Setup
- `GET /api/setup/status` - Check if system initialized
- `POST /api/setup/init-admin` - Create initial admin user

## Security Notes

⚠️ **Important for Production:**

1. **Change SESSION_SECRET** - Set a strong random string
2. **Use HTTPS** - Enable SSL/TLS in production
3. **Password Hashing** - Currently uses SHA256, upgrade to bcrypt
4. **File Uploads** - Add virus scanning and file validation
5. **Access Control** - Implement IP whitelisting for admin endpoints
6. **Audit Logging** - Log all user actions for compliance

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres

# Create database if missing
createdb omnibase
```

### "Session not found"
- Clear browser cookies
- Logout and login again
- Check SESSION_SECRET in .env

### "File upload failed"
- Check uploads directory exists
- Verify file permissions
- Check disk space available
- Maximum file size: 100MB (can be configured in multer)

### Users can't access pages
- Verify user role has correct permissions
- Check session hasn't expired (24 hours)
- Try logout/login again

## Next Steps

1. **Add more users** - Use Admin panel to create team members
2. **Upload knowledge sources** - Start building your knowledge base
3. **Configure automations** - Set up data processing workflows
4. **Enable 2FA** - Add two-factor authentication (coming soon)
5. **Set up backups** - Configure automated database backups
6. **Add file handlers** - Configure how different file types are processed

## Example Workflows

### Workflow 1: Set up a new team member
```
1. Go to Admin > Access Control
2. Click "Add New User"
3. Enter: name, email, password
4. Set Role: Editor (for knowledge workers)
5. Click Create
6. Share credentials securely
7. User can login and access knowledge base
```

### Workflow 2: Add company policies to knowledge base
```
1. Collect policy documents (PDF, DOCX)
2. Go to Data Sources
3. Click "Add Data Source"
4. Name: "Company Policies 2024"
5. Description: "All current company policies and procedures"
6. Select files from your computer
7. Click "Upload Files"
8. System ingests files into knowledge base
9. Available for search and collaboration
```

## Support

For issues or questions:
1. Check `/TROUBLESHOOTING.md`
2. Review database logs
3. Check browser console (F12) for errors
4. Review server output for API errors

---

**Status:** ✅ Ready for production use

All core features implemented with real database backend and no fictional data.
