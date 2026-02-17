# HireTrack

A Chrome extension + FastAPI backend for tracking job applications.
Save jobs from anywhere, track your application status, and never lose
track of where you've applied.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Extension:** React, TypeScript, Tailwind CSS, Vite + CRXJS
- **Testing:** pytest, httpx

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: .\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs available at http://localhost:8000/docs

### Chrome Extension
```bash
cd extension
npm install
npm run dev
```

Then load in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/dist/` folder

### Run Tests
```bash
cd backend
pytest tests/ -v
```

## Features

- Create, read, update, delete job applications
- Filter by status (Wishlist / Applied / OA / Interview / Offer / Rejected)
- Search by company or role name
- Color-coded status badges with inline editing
- Persistent storage via SQLite