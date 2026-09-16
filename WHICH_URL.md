# Co-Work - URL & Access Guide

## ✅ Primary Access URL
```
http://localhost:3000
```
**This is the unified URL for the Co-Work application.**

---

## 🏛️ Architecture Details

Co-Work operates as a single, unified full-stack Node.js / Express server on **port 3000**:
- **Single Port Simplicity**: All client assets, API endpoints, WebSockets, and AI pipelines run on port 3000.
- **No Secondary Ports**: There are no separate ports (such as 8000 or 5173). All routes are handled through port 3000.
- **Health Check**:
  - `GET http://localhost:3000/api/health`
  - `GET http://localhost:3000/health`

---

## 🚀 How to Launch

From the root directory:
```bash
npm run dev
```

Then visit **http://localhost:3000** in your browser.
