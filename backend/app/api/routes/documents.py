import hashlib
import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.api.dependencies import CurrentUser, Database
from app.core.config import get_settings
from app.db.models import Document, DocumentPage
from app.schemas.document import DocumentResponse
from app.services.document_processing_service import process_document

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.get("", response_model=list[DocumentResponse])
async def list_documents(user: CurrentUser, db: Database) -> list[Document]:
    result = await db.scalars(
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    )
    return list(result)


async def owned_document(document_id: str, user: CurrentUser, db: Database) -> Document:
    document = await db.scalar(
        select(Document).where(Document.id == document_id, Document.user_id == user.id)
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, user: CurrentUser, db: Database) -> Document:
    return await owned_document(document_id, user, db)


@router.get("/{document_id}/file")
async def get_document_file(document_id: str, user: CurrentUser, db: Database) -> FileResponse:
    document = await owned_document(document_id, user, db)
    path = Path(document.storage_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Original file is missing")
    return FileResponse(
        path,
        media_type=document.mime_type,
        filename=document.original_filename,
        content_disposition_type="inline",
    )


@router.get("/{document_id}/text")
async def get_document_text(document_id: str, user: CurrentUser, db: Database) -> dict:
    document = await owned_document(document_id, user, db)
    pages = list(
        await db.scalars(
            select(DocumentPage)
            .where(DocumentPage.document_id == document.id)
            .order_by(DocumentPage.page_number)
        )
    )
    if not pages and document.processing_status not in {"FAILED", "OCR_REQUIRED"}:
        document = await process_document(document, db)
        pages = list(
            await db.scalars(
                select(DocumentPage)
                .where(DocumentPage.document_id == document.id)
                .order_by(DocumentPage.page_number)
            )
        )
    return {
        "document_id": document.id,
        "status": document.processing_status,
        "error": document.processing_error,
        "pages": [
            {"page_number": page.page_number, "text": page.extracted_text} for page in pages
        ],
    }


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(document_id: str, user: CurrentUser, db: Database) -> Document:
    document = await owned_document(document_id, user, db)
    return await process_document(document, db)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    user: CurrentUser,
    db: Database,
    file: UploadFile = File(),
    category: str = Form(default="Other"),
) -> Document:
    original_name = Path(file.filename or "document").name
    extension = Path(original_name).suffix.lower()
    mime_type = file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream"
    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Only PDF, DOCX and TXT files are supported")

    content = await file.read(settings.max_upload_size_mb * 1024 * 1024 + 1)
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Files must be {settings.max_upload_size_mb} MB or smaller")
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded file is empty")

    checksum = hashlib.sha256(content).hexdigest()
    duplicate = await db.scalar(
        select(Document).where(Document.user_id == user.id, Document.checksum == checksum)
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="This document has already been uploaded")

    document_id = str(uuid4())
    stored_filename = f"original{extension}"
    destination = settings.upload_path / "users" / user.id / "documents" / document_id
    destination.mkdir(parents=True, exist_ok=False)
    file_path = destination / stored_filename
    file_path.write_bytes(content)

    document = Document(
        id=document_id,
        user_id=user.id,
        title=Path(original_name).stem,
        original_filename=original_name,
        stored_filename=stored_filename,
        mime_type=mime_type,
        file_size=len(content),
        checksum=checksum,
        category=category[:80],
        storage_path=str(file_path),
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return await process_document(document, db)
