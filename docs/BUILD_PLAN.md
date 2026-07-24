# AI Med MVP build plan

This document turns the full requirements in [PRD.md](./PRD.md) into testable delivery slices.

## Current slice — Foundation

- [x] Local monorepo with separate frontend and backend applications
- [x] Centralized environment configuration and documented model identifiers
- [x] Async SQLite application models for users and documents
- [x] Argon2 password hashing, JWT sessions, and protected endpoints
- [x] Ownership-scoped document listing and upload
- [x] Exact original-file preservation under generated, user-specific paths
- [x] Type, size, empty-file, and per-user checksum duplicate validation
- [x] Responsive registration, dashboard, record list, and upload experience
- [x] Persistent privacy and medical-limitation messaging
- [x] Initial RRF and safety-classifier unit tests
- [x] Working application navigation and page rendering
- [x] Protected original-file and extracted-text viewing
- [x] PDF, DOCX, and TXT extraction with OCR-required detection
- [x] Persisted conversations and Gemini-grounded answers with structured citations

## Next slice — Document ingestion

- Create section-aware chunks from the extracted page records.
- Add SQLite FTS5 indexing and Chroma persistent vector storage.
- Replace the local extractive summary with a factual Gemini summary.

## Following slices

1. Hybrid retrieval with strict user and selected-document filters.
2. Conversations, messages, and sanitized SSE streaming.
3. Structured citations and source-to-document navigation.
4. Deletion across relational, lexical, vector, and file stores.
5. Synthetic evaluation records, cross-user isolation tests, and RAG quality checks.

No real medical records should be used during prototype development.
