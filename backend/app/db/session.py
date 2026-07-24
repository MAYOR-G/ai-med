from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.models import Base

settings = get_settings()

db_url = settings.database_url
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(db_url, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    print(f"Starting database initialization...")
    print(f"Database URL scheme: {db_url.split('://')[0]}")
    if settings.database_url.startswith("sqlite"):
        Path("data").mkdir(parents=True, exist_ok=True)
    try:
        print("Attempting to connect to database and run migrations...")
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        print("Database initialization successful!")
    except Exception as e:
        print(f"CRITICAL ERROR connecting to database: {e}")
        # Re-raise so the app still crashes, but now we have the exact error in the logs!
        raise


async def get_db():
    async with SessionLocal() as session:
        yield session

