# AI Med

AI Med is a local technical prototype for organizing medical documents and asking educational questions grounded in those records. It is not a diagnostic system, doctor replacement, prescription platform, or emergency service.

The complete supplied product requirements are preserved in [docs/PRD.md](./docs/PRD.md). Implementation status and sequencing are tracked in [docs/BUILD_PLAN.md](./docs/BUILD_PLAN.md).

## What works in the first build

- Local account registration, login, logout, and session restoration
- Argon2 password hashing and ownership-protected API routes
- PDF, DOCX, and TXT upload up to 20 MB
- Exact original-file storage in generated user/document directories
- MIME/extension validation and per-user SHA-256 duplicate detection
- Responsive dashboard, empty states, recent-record list, and drag-and-drop upload
- Working medical-history, original-document viewer, extracted-text, chat, and conversation pages
- Immediate PDF, DOCX, and TXT text extraction with `OCR_REQUIRED` detection
- Gemini 2.5 Flash answers grounded in retrieved document pages with clickable citations
- Configurable Gemini generation and embedding model names
- Starter safety classification and reciprocal-rank-fusion logic

Chroma vector indexing, embedding-based retrieval, and token-by-token SSE streaming remain in the next RAG slice. The current chat uses page-level lexical retrieval and persisted, structured citations.

## Run locally

Requirements: Python 3.12+, Node.js 20+, and npm.

### API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
# Add your Gemini API key to .env before using chat:
# GEMINI_API_KEY=your-key
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### Web app

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

If the API was already running when dependencies changed, stop it with `Ctrl+C`, reinstall, and restart it. Opening `http://localhost:8000/` shows API status; the application itself runs on port 5173.

## Configuration and data safety

Do not place a Gemini key in frontend files. Set it only in `backend/.env`. Original uploads, SQLite data, and Chroma data are ignored by Git.

Although storage is local, AI features are not fully local: extracted text will be transmitted to Gemini for embeddings, summaries, and answers once those services are enabled. Use only synthetic or deliberately anonymized records during development and review the current provider terms before any real-user deployment.
