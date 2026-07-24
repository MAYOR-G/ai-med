from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document, DocumentPage, ProcessingStatus
from app.services.extraction_service import extract_document


async def process_document(document: Document, db: AsyncSession) -> Document:
    document.processing_status = ProcessingStatus.PROCESSING
    document.processing_error = None
    await db.flush()
    try:
        pages = extract_document(Path(document.storage_path), document.mime_type)
        await db.execute(delete(DocumentPage).where(DocumentPage.document_id == document.id))
        non_empty_pages = [page for page in pages if page.text]
        if not non_empty_pages:
            document.processing_status = ProcessingStatus.OCR_REQUIRED
            document.processing_error = "No selectable text was found. OCR is required."
        else:
            db.add_all(
                DocumentPage(
                    document_id=document.id,
                    page_number=page.page_number,
                    extracted_text=page.text,
                )
                for page in non_empty_pages
            )
            document.page_count = len(pages)
            document.summary = _local_summary(non_empty_pages)
            document.processing_status = ProcessingStatus.READY
        await db.commit()
        await db.refresh(document)
        return document
    except Exception as exc:
        document.processing_status = ProcessingStatus.FAILED
        document.processing_error = f"Text extraction failed: {type(exc).__name__}"
        await db.commit()
        await db.refresh(document)
        return document


def _local_summary(pages) -> str:
    text = " ".join(page.text for page in pages)
    if len(text) <= 260:
        return text
    return text[:257].rsplit(" ", 1)[0] + "…"

