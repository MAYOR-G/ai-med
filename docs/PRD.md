# AI Med — Product Requirements Document

**Version:** 1.0
**Product type:** Personalized medical-information and document-intelligence application
**Development stage:** Local MVP / technical prototype
**Working name:** AI Med

---

## 1. Product Overview

AI Med is a personalized health-information application that allows users to:

1. Upload and organize personal medical documents.
2. View each original document inside the application.
3. ask medical and health-related questions through an AI chatbot.
4. Receive answers informed by both:

   * General medical knowledge available to the AI model.
   * Relevant information retrieved from the user’s uploaded medical documents.
5. Review the document passages used to generate each personalized answer.

The system will use a Retrieval-Augmented Generation pipeline so that the AI does not need to receive every medical document during every conversation. Instead, it retrieves only the most relevant document sections before generating an answer.

AI Med is an **informational prototype**, not a diagnostic system, clinical decision-support tool, doctor replacement, prescription platform, or emergency service.

---

## 2. Important Technical Decisions

### 2.1 Gemini model roles

The models should have separate responsibilities:

* **Answer generation:** `gemini-2.5-flash`
* **Document and query embeddings:** `gemini-embedding-001` or `gemini-embedding-2`

Gemini 2.5 Flash is a generation model and should not be used as the embedding model. Google currently provides dedicated embedding models for semantic search and RAG. `gemini-embedding-001` is suitable for text-only retrieval, while `gemini-embedding-2` supports multimodal inputs such as text, images and documents.

### 2.2 Recommended embedding choice

For the first MVP, use:

```text
gemini-embedding-001
```

This is sufficient when medical documents are converted into extracted text before indexing.

Use `gemini-embedding-2` later when AI Med needs native retrieval across:

* Scanned reports
* X-rays or medical images
* Charts
* Audio recordings
* Other multimodal medical content

### 2.3 Hybrid retrieval

The application should combine:

* **Semantic search:** ChromaDB vector similarity.
* **Lexical search:** SQLite FTS5 keyword and BM25 search.
* **Metadata filtering:** user ID, document ID, date, category and page number.
* **Result fusion:** combine and rerank results from both retrieval methods.

Chroma supports persistent local storage, metadata filtering, vector search and document search, making it suitable for the semantic side of the MVP.

SQLite FTS5 provides full-text retrieval and built-in BM25 ranking, which makes it a strong lightweight option for the lexical side of the local prototype.

---

## 3. Product Vision

AI Med should give users a simple, private-feeling workspace where their medical documents are no longer disconnected files.

The system should help users understand and navigate their health records by allowing questions such as:

* “What medications were mentioned in my latest report?”
* “When was high blood pressure first mentioned?”
* “Summarize the findings from my blood tests.”
* “Compare my last two laboratory reports.”
* “What did the doctor recommend after my previous appointment?”
* “Which document mentioned an allergy to penicillin?”
* “Explain this result in simple language.”
* “What questions should I ask my doctor about this report?”

The assistant must distinguish between:

1. Information found in the user’s documents.
2. General educational information.
3. Information it cannot determine from the available records.

---

## 4. Product Goals

### Primary goals

* Provide a clean medical document library.
* Preserve and display original uploaded files.
* Extract and index document content automatically.
* Provide personalized RAG-powered conversations.
* Stream chatbot responses smoothly.
* Cite the specific documents and pages used.
* Prevent one user’s documents from appearing in another user’s results.
* Clearly communicate uncertainty and medical limitations.

### Secondary goals

* Organize records by category and date.
* Generate document summaries.
* Allow questions about one selected document.
* Allow questions across the complete medical history.
* Store conversation history locally.
* Show document-processing progress and errors.

### Non-goals for the MVP

The first version will not include:

* Document sharing
* Hospital or clinic dashboards
* Doctor accounts
* Prescription generation
* Medical diagnosis
* Treatment recommendations
* Appointment booking
* Insurance processing
* Electronic health record integrations
* Pharmacy integrations
* Wearable-device integrations
* Medical image diagnosis
* Voice conversations
* Native mobile applications
* Cloud deployment
* Real-time collaboration

---

## 5. Target Users

### Primary user

An individual who wants to upload and better understand their personal medical records.

### Future users

* Family caregivers
* Doctors reviewing patient-provided documents
* Clinics
* Medical researchers
* Health-insurance teams

These future user types are outside the MVP.

---

## 6. Core User Journey

### First-time experience

1. User opens AI Med.
2. User creates a local account or signs in.
3. User sees a short product explanation and medical disclaimer.
4. User accepts the terms for processing uploaded medical information.
5. User reaches the dashboard.
6. User uploads one or more medical documents.
7. AI Med displays an upload and processing status.
8. The system extracts, chunks, embeds and indexes the document.
9. The document appears in the medical-history library.
10. The user opens the chatbot and asks a question.
11. The system retrieves relevant passages.
12. Gemini generates a streamed response.
13. The answer shows document citations.
14. Clicking a citation opens the original document at the relevant page where possible.

### Returning-user experience

1. User signs in.
2. Dashboard displays recent documents and conversations.
3. User continues a previous chat or starts a new one.
4. The assistant searches only that user’s indexed medical records.
5. User can open any cited record directly from the answer.

---

## 7. Main Application Areas

### 7.1 Authentication

For the MVP, provide simple local authentication.

Required capabilities:

* Register with name, email and password.
* Sign in.
* Sign out.
* Persist authenticated session.
* Hash passwords securely.
* Prevent access to another user’s documents or conversations.

Recommended implementation:

* JWT access token
* HTTP-only cookie where practical
* Argon2 password hashing
* FastAPI authentication dependencies
* User ownership checks on every protected endpoint

A development-only single-user mode may be included, but the default architecture should still support multiple isolated users.

---

### 7.2 Dashboard

The dashboard should provide a quiet, clean overview rather than a complex analytics screen.

Display:

* Welcome message
* Total medical documents
* Documents processed successfully
* Documents awaiting processing
* Recent uploads
* Recent conversations
* “Upload document” button
* “Ask AI Med” button

Do not use unnecessary charts in the first version.

---

### 7.3 Medical History Library

The medical-history page should display uploaded documents in a clean list or card grid.

Each document should show:

* Document title
* Original filename
* Document category
* Report or document date
* Upload date
* File type
* File size
* Page count, when available
* Processing status
* Short AI-generated summary
* View action
* Ask about this document action
* Delete action

Suggested document categories:

* Laboratory Result
* Prescription
* Medical Report
* Discharge Summary
* Imaging Report
* Vaccination Record
* Doctor’s Note
* Referral
* Insurance Document
* Other

Users should be able to:

* Search documents by name.
* Filter by category.
* Filter by date.
* Sort by newest, oldest or title.
* Open the original file.
* Rename a document.
* Edit its category and date.
* Reprocess a failed document.
* Permanently delete it.

---

### 7.4 Document Upload

Supported MVP formats:

* PDF
* DOCX
* TXT

Optional experimental formats:

* PNG
* JPG
* JPEG

Upload requirements:

* Drag-and-drop upload.
* File-selection button.
* Multiple-file upload.
* File-type validation.
* File-size validation.
* Duplicate-file detection using a checksum.
* Progress indicator.
* Processing-stage indicator.
* Clear error messages.

Suggested maximum file size for local testing:

```text
20 MB per document
```

The system must preserve the original file exactly as uploaded.

The original file and extracted text must be treated as separate resources:

```text
Original file → document viewing
Extracted text → search, embeddings and AI context
```

---

### 7.5 Document Processing Pipeline

When a user uploads a document, the backend should perform the following process.

#### Stage 1: Validate

* Confirm allowed MIME type.
* Confirm file extension.
* Confirm file-size limit.
* Generate SHA-256 checksum.
* Check for an existing duplicate belonging to the same user.
* Store a safe generated filename rather than trusting the uploaded filename.

#### Stage 2: Store original

Save the original document under a user-specific directory:

```text
storage/
  users/
    {user_id}/
      documents/
        {document_id}/
          original.pdf
```

#### Stage 3: Extract text

Recommended libraries:

* PDF: PyMuPDF
* DOCX: python-docx
* TXT: standard Python text reader

For PDFs, preserve:

* Page number
* Extracted page text
* Document title
* Page count

Scanned PDFs without selectable text should return:

```text
OCR_REQUIRED
```

OCR can be added after the first MVP.

#### Stage 4: Clean text

* Normalize whitespace.
* Remove repeated headers and footers where safely detectable.
* Preserve medical measurements.
* Preserve dates.
* Preserve headings.
* Do not rewrite or medically interpret the source text during indexing.

#### Stage 5: Chunk text

Recommended starting configuration:

```text
Chunk size: 700–1,000 tokens
Chunk overlap: 100–150 tokens
```

Prefer section-aware and page-aware chunking rather than splitting only by character count.

Each chunk should include:

* Chunk ID
* User ID
* Document ID
* Page number
* Section heading
* Chunk index
* Chunk text
* Document category
* Document date
* Source filename

#### Stage 6: Generate embeddings

Send each chunk to the selected Gemini embedding model.

Store the resulting vector in ChromaDB with the chunk metadata.

#### Stage 7: Create lexical index

Insert the same chunk text into a SQLite FTS5 table for keyword and BM25 retrieval.

#### Stage 8: Generate document summary

Generate a short factual summary containing:

* Document type
* Date
* Major topics
* Named tests or medications
* Key findings explicitly stated in the document

The summary must not invent a diagnosis or recommendation.

#### Stage 9: Complete processing

Set document status to:

```text
READY
```

Other valid states:

```text
UPLOADED
PROCESSING
READY
FAILED
OCR_REQUIRED
DELETING
```

---

## 8. AI Chatbot

### 8.1 Chat modes

Provide two chat modes.

#### All medical history

The assistant searches all documents owned by the current user.

#### Selected document

The assistant searches only the document selected by the user.

The active mode must be clearly visible above the chat input.

Example:

```text
Searching: All medical records
```

or:

```text
Searching: Blood Test — 12 March 2026
```

---

### 8.2 Conversation interface

The chatbot interface should include:

* Conversation title
* Scope selector
* Message history
* Suggested starter questions
* Multiline input
* Send button
* Stop-generating button
* New-conversation button
* Streaming answer
* Markdown formatting
* Expandable citations
* Copy-response action
* Retry action
* Feedback controls
* Clear medical disclaimer

Responses should support:

* Paragraphs
* Headings
* Numbered steps
* Short bullet lists
* Bold text
* Tables where genuinely useful
* Source citations

Rendered Markdown must be sanitized before display.

---

### 8.3 Streaming behaviour

Use Server-Sent Events for the first version.

FastAPI supports HTTP streaming and SSE, while Gemini’s Python SDK supports streamed content generation.

Suggested event structure:

```text
event: status
data: {"stage":"searching"}

event: sources
data: {"sources":[...]}

event: token
data: {"text":"Your"}

event: token
data: {"text":" result"}

event: complete
data: {"message_id":"..."}

event: error
data: {"message":"Unable to generate the response."}
```

The frontend should buffer small token fragments before rendering them. This prevents individual characters or broken Markdown from flashing on the screen.

Recommended behaviour:

* Update the displayed text every 30–60 milliseconds.
* Keep the viewport pinned only when the user is already near the bottom.
* Do not force-scroll after the user scrolls upward.
* Display a subtle typing indicator before the first text arrives.
* Disable the send button while a message is being submitted.
* Allow generation cancellation.

---

## 9. RAG Pipeline

### 9.1 Query preparation

When the user sends a question:

1. Validate the authenticated user.
2. Save the user message.
3. Determine the selected search scope.
4. Normalize the query.
5. Optionally create a standalone search query from recent conversation context.
6. Generate a query embedding.
7. Run semantic and lexical retrieval concurrently.

### 9.2 Semantic retrieval

Query ChromaDB using:

* Query embedding
* User ID filter
* Optional document ID filter
* Optional category filter
* Top-K result limit

Initial setting:

```text
Semantic top K: 10
```

### 9.3 Lexical retrieval

Query SQLite FTS5 using:

* Cleaned user query
* User ID restriction
* Optional document ID restriction
* BM25 ranking

Initial setting:

```text
Lexical top K: 10
```

### 9.4 Result fusion

Combine semantic and lexical results using Reciprocal Rank Fusion.

Example:

```text
RRF score = 1 / (60 + semantic_rank)
          + 1 / (60 + lexical_rank)
```

Then:

* Remove duplicate chunks.
* Prefer diverse pages and documents.
* Apply a relevance threshold.
* Select the strongest final passages.

Initial setting:

```text
Final context chunks: 5–8
```

### 9.5 Optional reranking

Reranking is not necessary for the first implementation.

A later version may ask Gemini to score retrieved passages for relevance before response generation.

### 9.6 Context construction

Each retrieved chunk should be passed to Gemini in a clear structure:

```text
[SOURCE 1]
Document: Blood Test
Document ID: ...
Page: 2
Date: 2026-03-12
Content:
...

[SOURCE 2]
Document: Doctor Consultation
Page: 1
Content:
...
```

Never send unrelated chunks merely to fill the context window.

### 9.7 Answer-generation rules

The system instruction should require the assistant to:

* Prioritize the user’s retrieved records.
* Cite personalized claims.
* Separate record-based facts from general information.
* State when information is unavailable.
* Avoid inventing values, dates, diagnoses or medications.
* Avoid claiming that a condition has been confirmed unless a cited document explicitly confirms it.
* Encourage consultation with a qualified professional for medical decisions.
* Use simple and calm language.
* Avoid alarming conclusions.
* Never prescribe medication or alter dosages.
* Never instruct the user to discontinue prescribed treatment.
* Recognize emergency language and direct the user to immediate local emergency assistance.

---

## 10. Citation System

Each personalized answer should cite its sources using labels such as:

```text
[1] Blood Test, page 2
[2] Consultation Notes, page 1
```

The response payload should contain structured citation information separately from the generated Markdown:

```json
{
  "citation_id": 1,
  "document_id": "uuid",
  "document_title": "Blood Test",
  "page_number": 2,
  "chunk_id": "uuid",
  "excerpt": "Relevant source passage..."
}
```

Clicking a citation should:

1. Open the document viewer.
2. Navigate to the relevant page.
3. Display the source excerpt beside the document.
4. Highlight matching text where technically possible.

The backend must verify document ownership again when a citation is opened.

---

## 11. Medical Safety Requirements

AI Med must be positioned as:

```text
An educational assistant that helps users understand and organize their medical information.
```

It must not be presented as:

* A doctor
* A diagnostic tool
* A clinical system
* An emergency service
* A medical-device replacement
* A source of prescriptions

This restriction is particularly important because the current Gemini API terms prohibit using the service in clinical practice or to provide medical advice.

### Required persistent disclaimer

Display near the chat input:

> AI Med provides general educational information and may summarize your uploaded records. It does not provide diagnosis, treatment or emergency medical care.

### Emergency response behaviour

When a message indicates a potentially immediate emergency, the assistant should stop the ordinary RAG response and advise the user to:

* Contact local emergency services.
* Seek urgent in-person medical attention.
* Tell a nearby trusted adult or person who can assist them.

The response should not attempt to diagnose the emergency.

### Medication behaviour

AI Med may:

* Identify a medication mentioned in a user’s record.
* Explain its common purpose in general terms.
* Help prepare questions for a pharmacist or doctor.

AI Med must not:

* Prescribe medication.
* Recommend a specific dose.
* Tell users to increase or reduce a dose.
* Tell users to stop prescribed medication.
* Claim two medicines are safe together without professional verification.

---

## 12. Privacy and Data Handling

### Important limitation

Although SQLite, ChromaDB and file storage will run locally, the application is **not entirely local** when Gemini APIs are used.

Extracted medical text will be transmitted externally when:

* Generating embeddings
* Generating document summaries
* Generating chatbot answers

The application must disclose this before a user uploads a document.

For sensitive medical records, use a billing-enabled Gemini project and review Google’s current data-processing terms before any real-user deployment. Google states that paid-service prompts and responses are not used to improve its products, although limited retention and abuse-monitoring conditions may still apply.

### MVP privacy requirements

* Require authentication.
* Store API keys only on the backend.
* Never expose the Gemini API key in frontend code.
* Keep uploaded files outside publicly served directories.
* Use generated storage filenames.
* Validate ownership on every document request.
* Validate ownership on every Chroma query.
* Filter retrieval by user ID.
* Sanitize filenames and MIME types.
* Prevent path traversal.
* Do not log document contents.
* Do not log complete prompts in production mode.
* Redact sensitive values from error reports.
* Delete vectors, chunks and original files together.
* Maintain an audit record for uploads, views, chats and deletions.
* Show a confirmation dialog before permanent deletion.

### Development warning

Only synthetic or deliberately anonymized medical records should be used during early development.

---

## 13. Functional Requirements

### FR-01: User authentication

The user can register, sign in and sign out.

### FR-02: Document upload

The user can upload supported medical documents.

### FR-03: Processing visibility

The user can see whether a document is uploading, processing, ready or failed.

### FR-04: Original document preservation

The system stores and serves the unmodified original file.

### FR-05: Document viewing

The user can open a PDF inside the application and download the original file.

### FR-06: Medical-history search

The user can search and filter their document library.

### FR-07: RAG indexing

The system extracts, chunks, embeds and indexes document text.

### FR-08: Hybrid retrieval

The system combines vector and lexical search.

### FR-09: Personalized conversation

The chatbot can answer questions using the authenticated user’s records.

### FR-10: Document-specific conversation

The chatbot can restrict retrieval to one selected document.

### FR-11: Streaming output

Responses appear progressively without waiting for the complete answer.

### FR-12: Source citations

Personalized statements include links to supporting documents and pages.

### FR-13: Conversation history

Users can reopen earlier conversations.

### FR-14: Deletion

Users can permanently delete documents and associated indexed data.

### FR-15: Safety messaging

The system presents limitations and handles emergency or high-risk medical prompts safely.

---

## 14. Non-Functional Requirements

### Performance

Target local MVP performance:

* Initial page load: under 3 seconds.
* Normal API response: under 500 milliseconds excluding AI operations.
* First streamed answer text: ideally under 5 seconds.
* Document-library search: under 1 second.
* PDF viewer opening: under 3 seconds for ordinary files.
* Retrieval execution: under 2 seconds for a small local collection.

### Reliability

* Failed processing must not corrupt existing records.
* Processing should be repeatable.
* Duplicate vectors must not be created during retries.
* Deleting a document must clean both indexes.
* Incomplete AI streams must be marked as interrupted.

### Accessibility

* Keyboard-accessible controls.
* Visible focus states.
* Sufficient contrast.
* Semantic HTML.
* Form labels.
* Screen-reader status announcements for uploads and streaming.
* Reduced-motion support.

### Maintainability

* Separate frontend and backend repositories or top-level folders.
* Clear service interfaces.
* No Gemini calls directly inside API route handlers.
* Centralized configuration.
* Database migrations.
* Automated tests.
* Structured logging.

---

## 15. Recommended Technology Stack

### Frontend

| Area            | Technology                     |
| --------------- | ------------------------------ |
| Framework       | React with Vite                |
| Language        | TypeScript                     |
| Styling         | Tailwind CSS                   |
| Components      | shadcn/ui                      |
| Routing         | React Router                   |
| Server state    | TanStack Query                 |
| Local UI state  | Zustand or React Context       |
| Forms           | React Hook Form                |
| Validation      | Zod                            |
| Markdown        | react-markdown                 |
| Markdown safety | rehype-sanitize                |
| Uploading       | react-dropzone                 |
| PDF viewing     | react-pdf with PDF.js          |
| Icons           | Lucide React                   |
| Streaming       | Fetch streaming or EventSource |

### Backend

| Area                      | Technology                        |
| ------------------------- | --------------------------------- |
| API framework             | FastAPI                           |
| Language                  | Python 3.12+                      |
| Server                    | Uvicorn                           |
| Validation                | Pydantic                          |
| ORM                       | SQLAlchemy 2                      |
| Migrations                | Alembic                           |
| Local relational database | SQLite                            |
| Async SQLite driver       | aiosqlite                         |
| Vector database           | ChromaDB PersistentClient         |
| Lexical search            | SQLite FTS5                       |
| Gemini SDK                | google-genai                      |
| PDF extraction            | PyMuPDF                           |
| DOCX extraction           | python-docx                       |
| File uploads              | python-multipart                  |
| Authentication            | PyJWT and Argon2 password hashing |
| Testing                   | pytest and httpx                  |
| Formatting/linting        | Ruff                              |
| Logging                   | Python structured logging         |

SQLAlchemy supports SQLite through Python’s built-in SQLite driver, making the combination appropriate for the local prototype.

### Avoid for the first version

Do not introduce these unless necessary:

* LangChain
* LlamaIndex
* Celery
* Redis
* Kafka
* Kubernetes
* Microservices
* Multiple vector databases
* Complex agent frameworks

The initial RAG pipeline should be implemented as explicit Python services. This keeps the behaviour easier to test and debug.

---

## 16. System Architecture

```text
┌─────────────────────────────────────┐
│          React Frontend             │
│                                     │
│ Dashboard                           │
│ Medical History                     │
│ Document Viewer                     │
│ AI Chat                             │
└─────────────────┬───────────────────┘
                  │ REST + SSE
                  ▼
┌─────────────────────────────────────┐
│          FastAPI Backend            │
│                                     │
│ Authentication Service              │
│ Document Service                    │
│ Ingestion Service                   │
│ Retrieval Service                   │
│ Conversation Service                │
│ Gemini Service                      │
│ Safety Service                      │
└───────┬───────────────┬─────────────┘
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────────┐
│ SQLite       │  │ ChromaDB         │
│              │  │                  │
│ Users        │  │ Chunk vectors    │
│ Documents    │  │ Chunk metadata   │
│ Chunks       │  │ User filters     │
│ FTS5 index   │  └──────────────────┘
│ Chats        │
│ Messages     │
│ Citations    │
└──────────────┘
        │
        ▼
┌──────────────────┐
│ Local Filesystem │
│ Original files   │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Gemini API       │
│ Generation       │
│ Embeddings       │
└──────────────────┘
```

---

## 17. Suggested Database Schema

### users

```text
id
name
email
password_hash
created_at
updated_at
last_login_at
```

### user_profiles

```text
id
user_id
date_of_birth
sex
blood_group
emergency_contact
created_at
updated_at
```

Structured medical-profile fields should be optional and excluded from the earliest build when not necessary.

### documents

```text
id
user_id
title
original_filename
stored_filename
mime_type
file_size
checksum
category
document_date
page_count
storage_path
summary
processing_status
processing_error
created_at
updated_at
```

### document_pages

```text
id
document_id
page_number
extracted_text
created_at
```

### document_chunks

```text
id
document_id
user_id
page_number
chunk_index
section_heading
chunk_text
token_count
chroma_record_id
created_at
```

### document_chunks_fts

SQLite FTS5 virtual table:

```text
chunk_id
user_id
document_id
title
section_heading
chunk_text
```

### conversations

```text
id
user_id
title
scope_type
scope_document_id
created_at
updated_at
```

### messages

```text
id
conversation_id
role
content
status
model_name
created_at
```

Roles:

```text
user
assistant
system
```

Statuses:

```text
pending
streaming
completed
cancelled
failed
```

### message_citations

```text
id
message_id
document_id
chunk_id
citation_number
page_number
excerpt
retrieval_score
created_at
```

### audit_logs

```text
id
user_id
action
resource_type
resource_id
metadata_json
created_at
```

---

## 18. API Requirements

Base path:

```text
/api/v1
```

### Authentication

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Documents

```text
POST   /documents
GET    /documents
GET    /documents/{document_id}
PATCH  /documents/{document_id}
DELETE /documents/{document_id}
POST   /documents/{document_id}/reprocess
GET    /documents/{document_id}/file
GET    /documents/{document_id}/status
GET    /documents/{document_id}/pages/{page_number}
```

### Conversations

```text
POST   /conversations
GET    /conversations
GET    /conversations/{conversation_id}
PATCH  /conversations/{conversation_id}
DELETE /conversations/{conversation_id}
```

### Messages

```text
POST   /conversations/{conversation_id}/messages
GET    /conversations/{conversation_id}/messages
GET    /conversations/{conversation_id}/stream
POST   /messages/{message_id}/cancel
POST   /messages/{message_id}/retry
```

A simpler implementation may combine message submission and streaming:

```text
POST /conversations/{conversation_id}/messages/stream
```

The endpoint can return an SSE response directly.

### Search

```text
GET  /search/documents
POST /search/chunks
```

The chunk-search endpoint should remain internal or development-only.

### Health

```text
GET /health
GET /health/database
GET /health/chroma
GET /health/gemini
```

The health endpoints must not expose secrets or sensitive document information.

---

## 19. Backend Module Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── documents.py
│   │       ├── conversations.py
│   │       ├── messages.py
│   │       └── health.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── db/
│   │   ├── session.py
│   │   ├── base.py
│   │   └── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── document_service.py
│   │   ├── extraction_service.py
│   │   ├── chunking_service.py
│   │   ├── embedding_service.py
│   │   ├── vector_service.py
│   │   ├── lexical_search_service.py
│   │   ├── retrieval_service.py
│   │   ├── conversation_service.py
│   │   ├── gemini_service.py
│   │   ├── citation_service.py
│   │   └── safety_service.py
│   ├── prompts/
│   │   ├── medical_assistant.txt
│   │   ├── document_summary.txt
│   │   └── query_rewrite.txt
│   └── utilities/
├── migrations/
├── storage/
├── chroma_data/
├── tests/
├── .env.example
├── requirements.txt
└── README.md
```

---

## 20. Frontend Structure

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── chat/
│   │   ├── documents/
│   │   ├── layout/
│   │   └── ui/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── DocumentViewPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── styles/
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 21. UI and Visual Direction

### General style

AI Med should feel:

* Calm
* Trustworthy
* Minimal
* Modern
* Human
* Well-spaced
* Professional

It should not use:

* Large decorative gradients
* Excessive glassmorphism
* Random floating cards
* Medical stock-photo overload
* Aggressive red interfaces
* AI-generated decorative elements
* Complex analytics
* Excessive animations

### Suggested palette

```text
Background:       #F8FAFC
Surface:          #FFFFFF
Primary text:     #0F172A
Secondary text:   #475569
Primary accent:   #0F766E
Soft accent:      #CCFBF1
Borders:          #E2E8F0
Warning:          #B45309
Error:            #B91C1C
Success:          #15803D
```

### Layout

Desktop:

```text
Left navigation
Main content
Optional right-side citation panel
```

Mobile:

```text
Top header
Single-column content
Bottom navigation or slide-out menu
```

### Main navigation

* Dashboard
* Medical History
* Ask AI Med
* Conversations
* Settings

---

## 22. Environment Configuration

Backend `.env`:

```text
APP_ENV=development
APP_NAME=AI Med
SECRET_KEY=
DATABASE_URL=sqlite+aiosqlite:///./data/aimed.db

GEMINI_API_KEY=
GEMINI_GENERATION_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

CHROMA_PATH=./chroma_data
UPLOAD_PATH=./storage
MAX_UPLOAD_SIZE_MB=20

ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173

RAG_SEMANTIC_TOP_K=10
RAG_LEXICAL_TOP_K=10
RAG_FINAL_TOP_K=6
RAG_MIN_RELEVANCE_SCORE=
```

Frontend `.env`:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Model identifiers must be configuration values rather than hardcoded throughout the application. This will make it possible to replace Gemini 2.5 Flash without changing the retrieval or conversation logic.

---

## 23. Testing Requirements

### Unit tests

Test:

* File validation
* Filename sanitization
* Text extraction
* Chunk construction
* Metadata generation
* User ownership checks
* Query normalization
* Hybrid result fusion
* Citation mapping
* Safety classification
* Document deletion cleanup

### Integration tests

Test:

* Register and login
* Upload and process PDF
* Chroma indexing
* SQLite FTS indexing
* Retrieval restricted by user ID
* Retrieval restricted by document ID
* Streamed answer completion
* Stream cancellation
* Failed Gemini request
* Deleted document exclusion
* Citation-to-document navigation

### RAG evaluation set

Create a small synthetic dataset containing:

* Blood-test report
* Prescription
* Consultation note
* Discharge summary

Create questions with known answers and expected source pages.

Measure:

* Retrieval hit rate
* Citation accuracy
* Unsupported-claim rate
* User-isolation failures
* Answer completeness
* Refusal and uncertainty behaviour

### Critical security test

Create two test users with different records.

Ask User A questions containing distinctive details from User B’s documents.

The test must confirm that no chunk, citation or generated answer exposes User B’s information.

---

## 24. MVP Acceptance Criteria

The MVP is complete when:

1. A user can create an account and sign in.
2. A PDF, DOCX or TXT medical document can be uploaded.
3. The original document can be viewed or downloaded.
4. Extracted text is divided into page-aware chunks.
5. Chunks are stored in ChromaDB.
6. Chunks are searchable through SQLite FTS5.
7. The chatbot combines semantic and keyword retrieval.
8. Retrieval is restricted to the authenticated user.
9. The chatbot can search all documents or one selected document.
10. Gemini responses stream smoothly to the frontend.
11. Personalized claims display document citations.
12. A citation opens the appropriate document and page.
13. Conversations are stored and can be reopened.
14. Deleting a document removes its file, chunks, lexical records and vectors.
15. Medical limitations are consistently displayed.
16. Emergency-style prompts trigger the appropriate safety response.
17. Automated tests confirm that cross-user retrieval does not occur.
18. The project can be started locally from documented setup instructions.

---

## 25. Development Sequence

### Phase 1: Foundation

* Create frontend and backend applications.
* Configure environment variables.
* Set up SQLite, SQLAlchemy and Alembic.
* Implement authentication.
* Build the main layout and navigation.

### Phase 2: Document management

* Implement file upload.
* Store original files.
* Create medical-history library.
* Add PDF document viewer.
* Add document deletion.

### Phase 3: Ingestion

* Extract PDF, DOCX and TXT content.
* Implement chunking.
* Generate Gemini embeddings.
* Store vectors in ChromaDB.
* Create SQLite FTS5 index.
* Add processing statuses.

### Phase 4: Retrieval

* Implement Chroma semantic search.
* Implement FTS5 keyword search.
* Add metadata filtering.
* Implement reciprocal-rank fusion.
* Add retrieval debugging tools for development.

### Phase 5: Chat

* Create conversations and messages.
* Add Gemini response generation.
* Implement SSE streaming.
* Render sanitized Markdown.
* Add stop and retry controls.

### Phase 6: Citations and safety

* Attach retrieved chunks to generated messages.
* Display citations.
* Open source documents from citations.
* Add medical safety instructions.
* Add emergency-message handling.
* Add privacy consent and disclosure.

### Phase 7: Testing and refinement

* Add unit and integration tests.
* Create synthetic medical documents.
* Test cross-user isolation.
* Evaluate retrieval and citation quality.
* Improve loading, empty and error states.
* Complete setup and architecture documentation.

---

## 26. Principal Risks

### Hallucinated medical information

**Mitigation:** Require citations for record-based statements, clearly label general information and permit the model to say it does not know.

### Incorrect retrieval

**Mitigation:** Combine semantic and lexical retrieval, preserve metadata, evaluate against known questions and expose source passages.

### Cross-user data exposure

**Mitigation:** Apply ownership filters at the API, SQL and Chroma levels and test isolation automatically.

### Sensitive information sent externally

**Mitigation:** Show explicit consent, use synthetic development data, enable billing where appropriate and review provider terms before real-user use.

### Scanned documents failing extraction

**Mitigation:** Detect empty pages and mark the document as requiring OCR rather than pretending processing succeeded.

### Model deprecation

**Mitigation:** Keep model identifiers configurable and isolate Gemini code behind generation and embedding interfaces.

### Broken streaming Markdown

**Mitigation:** Buffer stream fragments, sanitize completed Markdown and separately transmit structured citations.

### Overreliance on the assistant

**Mitigation:** Use persistent disclaimers, calibrated language, uncertainty statements and clear professional-care escalation.

---

## 27. Final Recommended MVP Stack

```text
Frontend
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Router
react-markdown
react-pdf

Backend
FastAPI
Python
Pydantic
SQLAlchemy
Alembic
SQLite
SQLite FTS5
ChromaDB
PyMuPDF
python-docx
google-genai

AI
Generation: gemini-2.5-flash
Embeddings: gemini-embedding-001

Communication
REST APIs
Server-Sent Events

Storage
Original files: local filesystem
Application records: SQLite
Lexical index: SQLite FTS5
Vector index: ChromaDB PersistentClient
```

This architecture is intentionally lightweight. It is sufficient to validate document ingestion, hybrid retrieval, personalized chat, citations and streaming before introducing cloud infrastructure or complex frameworks.
