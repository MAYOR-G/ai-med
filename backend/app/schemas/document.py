from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    original_filename: str
    mime_type: str
    file_size: int
    category: str
    document_date: date | None
    page_count: int | None
    summary: str | None
    processing_status: str
    processing_error: str | None
    created_at: datetime

