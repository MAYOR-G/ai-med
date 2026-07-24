import asyncio
import json
import re

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.dependencies import CurrentUser, Database
from app.core.config import get_settings
from app.db.models import Conversation, Document, DocumentPage, Message
from app.schemas.conversation import (
    ChatResponse,
    CitationResponse,
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.document_processing_service import process_document
from app.services.gemini_service import generate_answer
from app.services.safety_service import SafetyDisposition, classify_message, emergency_response

router = APIRouter(prefix="/conversations", tags=["conversations"])
settings = get_settings()


async def owned_conversation(conversation_id: str, user: CurrentUser, db: Database) -> Conversation:
    conversation = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user.id
        )
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def message_response(message: Message) -> MessageResponse:
    citations = json.loads(message.citations_json) if message.citations_json else []
    return MessageResponse(
        id=message.id,
        role=message.role,
        content=message.content,
        citations=[CitationResponse(**citation) for citation in citations],
        status=message.status,
        created_at=message.created_at,
    )


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    payload: ConversationCreate, user: CurrentUser, db: Database
) -> Conversation:
    if payload.scope_document_id:
        document = await db.scalar(
            select(Document).where(
                Document.id == payload.scope_document_id, Document.user_id == user.id
            )
        )
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")
    conversation = Conversation(
        user_id=user.id,
        scope_document_id=payload.scope_document_id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(user: CurrentUser, db: Database) -> list[Conversation]:
    return list(
        await db.scalars(
            select(Conversation)
            .where(Conversation.user_id == user.id)
            .order_by(Conversation.updated_at.desc())
        )
    )


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: str, user: CurrentUser, db: Database
) -> list[MessageResponse]:
    conversation = await owned_conversation(conversation_id, user, db)
    messages = list(
        await db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at)
        )
    )
    return [message_response(message) for message in messages]


@router.post("/{conversation_id}/messages", response_model=ChatResponse)
async def send_message(
    conversation_id: str, payload: MessageCreate, user: CurrentUser, db: Database
) -> ChatResponse:
    conversation = await owned_conversation(conversation_id, user, db)
    question = payload.content.strip()
    user_message = Message(conversation_id=conversation.id, role="user", content=question)
    db.add(user_message)

    if conversation.title == "New conversation":
        conversation.title = question[:80]

    disposition = classify_message(question)
    citations: list[dict] = []
    if disposition is SafetyDisposition.EMERGENCY:
        answer = emergency_response()
    elif disposition is SafetyDisposition.MEDICATION_CHANGE:
        answer = (
            "I can help identify what your records say about a medication, but I cannot recommend "
            "starting, stopping, or changing a dose. Please confirm medication changes with your "
            "doctor or pharmacist. If you tell me which record to review, I can summarize its wording."
        )
    else:
        context, citations = await retrieve_context(conversation, user, question, db)
        try:
            answer = await asyncio.to_thread(generate_answer, question, context)
        except RuntimeError as exc:
            await db.rollback()
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:
            await db.rollback()
            raise HTTPException(
                status_code=502,
                detail="Gemini could not generate an answer. Check the API key, model, and network.",
            ) from exc

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        citations_json=json.dumps(citations),
        model_name=settings.gemini_generation_model if disposition is SafetyDisposition.NORMAL else None,
    )
    db.add(assistant_message)
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return ChatResponse(
        user_message=message_response(user_message),
        assistant_message=message_response(assistant_message),
    )


async def retrieve_context(
    conversation: Conversation,
    user: CurrentUser,
    question: str,
    db: Database,
) -> tuple[str, list[dict]]:
    document_query = select(Document).where(Document.user_id == user.id)
    if conversation.scope_document_id:
        document_query = document_query.where(Document.id == conversation.scope_document_id)
    documents = list(await db.scalars(document_query))
    for document in documents:
        if document.processing_status in {"UPLOADED", "FAILED"}:
            await process_document(document, db)

    if not documents:
        return "", []
    document_ids = [document.id for document in documents]
    pages = list(
        await db.execute(
            select(DocumentPage, Document)
            .join(Document, DocumentPage.document_id == Document.id)
            .where(DocumentPage.document_id.in_(document_ids))
        )
    )
    terms = {term for term in re.findall(r"[a-z0-9]+", question.lower()) if len(term) > 2}

    def score(row) -> int:
        text = row[0].extracted_text.lower()
        return sum(text.count(term) for term in terms)

    ranked = sorted(pages, key=score, reverse=True)
    selected = [row for row in ranked if score(row) > 0][:6] or ranked[:3]
    context_parts: list[str] = []
    citations: list[dict] = []
    for index, (page, document) in enumerate(selected, start=1):
        excerpt = page.extracted_text[:1200]
        context_parts.append(
            f"[SOURCE {index}]\nDocument: {document.title}\nPage: {page.page_number}\nContent:\n{excerpt}"
        )
        citations.append(
            {
                "citation_id": index,
                "document_id": document.id,
                "document_title": document.title,
                "page_number": page.page_number,
                "excerpt": excerpt[:320],
            }
        )
    return "\n\n".join(context_parts), citations
