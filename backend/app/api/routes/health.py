from fastapi import APIRouter
from sqlalchemy import text

from app.api.dependencies import Database
from app.core.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@router.get("/health/database")
async def database_health(db: Database) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@router.get("/health/gemini")
async def gemini_health() -> dict[str, str]:
    return {"status": "configured" if settings.gemini_api_key else "not_configured"}

