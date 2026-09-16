# Notes Synchronization with Google Drive

## Overview
Your notes in Co-Work can be synchronized with Google Drive. This allows you to create notes in Co-Work and have them appear in a dedicated "Co-Work Notes" folder in your Google Drive.

## Features

### ✅ What's Synced
- **Note Title** - Full title preserved
- **Note Content** - Full content preserved  
- **Note Metadata** - Tags, creation date, update date
- **Bidirectional Sync** - Pull notes from Drive or push from Co-Work

### 📝 Supported Operations

#### 1. Create New Notes
```
POST /api/notes
{
  "title": "My Meeting Notes",
  "content": "Key points from the meeting...",
  "tags": ["meeting", "important"],
  "source": "manual"
}
```
✨ **Result**: Note appears in both Co-Work and Google Drive's "Co-Work Notes" folder

#### 2. Update Existing Notes
```
PUT /api/notes/{note_id}
{
  "title": "Updated Title",
  "content": "Updated content...",
  "tags": ["meeting", "important", "followup"]
}
```
✨ **Result**: Changes sync to Google Drive automatically

#### 3. Delete Notes
```
DELETE /api/notes/{note_id}
```
✨ **Result**: Note removed from both Co-Work and Google Drive

#### 4. Import Notes from Drive
```
POST /api/notes/import-from-drive
```
✨ **Result**: All notes from your Google Drive's "Co-Work Notes" folder are imported to Co-Work

**Response**:
```json
{
  "imported_count": 5,
  "skipped_count": 2,
  "errors": []
}
```

#### 5. Check Sync Status
```
GET /api/notes/{note_id}/sync-status
```
**Response**:
```json
{
  "note_id": "abc123",
  "sync_status": "synced",
  "drive_file_id": "xyz789",
  "last_sync": "2026-04-15T10:30:00.000Z"
}
```

## How It Works

### Storage Format
Notes are stored as `.txt` files in Google Drive with a metadata header:

```
[Co-Work Note]
ID: abc123
Synced: 2026-04-15T10:30:00.000Z

---

Your actual note content goes here...
```

### Synchronization Timeline
1. **Create** → Note saved locally/cloud → Synced to Google Drive
2. **Update** → Note updated → Synced to Google Drive
3. **Delete** → Note removed → Removed from Google Drive
4. **Import** → Pull all Drive notes → Create/update in workspace

### Sync Status
Each note has a `sync_status`:
- **`synced`** - Note is up-to-date in both places
- **`pending`** - Note is waiting to be synced to Drive
- **`not_synced`** - Note exists only in Co-Work

## Requirements

### OAuth Permissions
You need to grant Co-Work these permissions:
- ✅ **Google Calendar** - Create and manage events
- ✅ **Gmail** - Read and send emails  
- ✅ **Google Tasks** - Create and manage tasks
- ✅ **Google Drive** - Store and sync notes

**If you see "Drive sync failed"**, you may need to re-authenticate:
1. Click Sign Out
2. Click Sign In again
3. Grant permission for Google Drive access

## Access Your Notes

### In Co-Work App
- List: See all your notes in Notes view
- Search: Find notes by keyword with the universal search
- View: Appears in NotesPanel component

### In Google Drive
1. Open [Google Drive](https://drive.google.com)
2. Look for folder: **"Co-Work Notes"**
3. Open any `.txt` file to view or edit

> ⚠️ **Important**: Edit notes in Co-Work for auto-sync.

## Best Practices

✅ **Do This**:
- Create notes in Co-Work for auto-sync
- Use tags to organize notes (`#meeting`, `#todo`, `#idea`)
- Import from Drive to get existing notes
- Review sync status for important notes

❌ **Don't Do This**:
- Rename files in Drive (metadata header might break)
- Share Co-Work Notes folder with others (sync may conflict)

## Questions?

Check the main [README.md](./README.md) or [QUICKSTART.md](./QUICKSTART.md)
