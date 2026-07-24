from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "AI Med"
    secret_key: str = "development-only-change-me-before-use"
    database_url: str = "sqlite+aiosqlite:///./data/aimed.db"
    upload_path: Path = Path("./storage")
    chroma_path: Path = Path("./chroma_data")
    max_upload_size_mb: int = 20
    access_token_expire_minutes: int = 60
    allowed_origins: str = "http://localhost:5173"
    gemini_api_key: str = ""
    gemini_generation_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    rag_semantic_top_k: int = Field(default=10, ge=1, le=50)
    rag_lexical_top_k: int = Field(default=10, ge=1, le=50)
    rag_final_top_k: int = Field(default=6, ge=1, le=20)

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
