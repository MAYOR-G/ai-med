import re
from dataclasses import dataclass
from pathlib import Path

import fitz
from docx import Document as DocxDocument


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str


def clean_text(text: str) -> str:
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def extract_document(path: Path, mime_type: str) -> list[ExtractedPage]:
    if mime_type == "application/pdf":
        with fitz.open(path) as pdf:
            return [
                ExtractedPage(page_number=index + 1, text=clean_text(page.get_text("text")))
                for index, page in enumerate(pdf)
            ]
    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        document = DocxDocument(path)
        text = clean_text("\n".join(paragraph.text for paragraph in document.paragraphs))
        return [ExtractedPage(page_number=1, text=text)]
    if mime_type == "text/plain":
        text = clean_text(path.read_text(encoding="utf-8", errors="replace"))
        return [ExtractedPage(page_number=1, text=text)]
    raise ValueError("Unsupported document format")

