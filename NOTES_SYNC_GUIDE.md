# Notes Synchronization with Google Drive

## 📚 Overview
Your notes in Co-Work are stored and synchronized with Google Drive. This enables you to compose, edit, and organize notes within Co-Work while having them synchronized with a dedicated **"Co-Work Notes"** folder in your Google Drive.

---

## 🌟 Key Features

### ✅ Synced Data Points
- **Note Title** - Full title preserved
- **Note Content** - Markdown and plain text content preserved  
- **Note Metadata** - Category tags, creation date, updated date, workspace ID
- **Bidirectional Sync** - Import notes from Google Drive or push updates from Co-Work

---

## 📝 API Operations Reference

All requests must include an `Authorization: Bearer <token>` header.

### 1. List Workspace Notes
```http
GET /notes
# or
GET /api/notes
```

### 2. Create New Note
```http
POST /notes
Content-Type: application/json

{
  "title": "Architecture Sync Notes",
  "content": "Discussed token caching and tool execution latency...",
  "tags": ["architecture", "meeting"],
  "source": "manual"
}
```

### 3. Update Existing Note
```http
PUT /notes/:id
Content-Type: application/json

{
  "title": "Architecture Sync Notes (Updated)",
  "content": "Discussed token caching, latency benchmarks, and streaming...",
  "tags": ["architecture", "meeting", "action-item"]
}
```

### 4. Delete Note
```http
DELETE /notes/:id
```

### 5. Import Notes from Google Drive
```http
POST /api/notes/import-from-drive
```
**Response**:
```json
{
  "imported_count": 5,
  "skipped_count": 0,
  "errors": []
}
```

### 6. Check Note Sync Status
```http
GET /api/notes/:id/sync-status
```
**Response**:
```json
{
  "note_id": "note_1",
  "sync_status": "synced",
  "drive_file_id": "1A2B3C...",
  "last_sync": "2026-09-16T12:24:59.661Z"
}
```

---

## 🗂️ Google Drive Storage Format

Notes are stored as `.txt` or `.md` files in Google Drive within the **"Co-Work Notes"** folder with structured metadata headers:

```
[Co-Work Note]
ID: note_17895615
Workspace: ws_personal_user_cowork_1
Synced: 2026-09-16T12:24:59.661Z
Tags: architecture, meeting

---

Discussed token caching and tool execution latency...
```

---

## 🔐 OAuth & Permissions

To enable Google Drive synchronization:
- When prompted during Google OAuth sign-in, authorize access to **Google Drive (create & edit files)**.
- If using **Direct Workspace Access**, notes are securely stored in the workspace database and queued for cloud sync.

---

## 💡 Best Practices

1. **Tagging**: Tag notes with `#meeting`, `#architecture`, or `#ideas` for fast filtering in the universal search engine.
2. **AI Action Extraction**: You can ask the AI Chief of Staff in chat: *"Summarize my recent notes on architecture and create action items."*
3. **Preserve Metadata**: When editing files in Google Drive directly, do not remove the `[Co-Work Note]` metadata header block.

