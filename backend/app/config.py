from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    database_url_sync: str = ""

    supabase_jwt_secret: str

    cors_origins: str = "http://localhost:5173,https://power-grid-ruddy.vercel.app"

    session_secret: str = ""
    admin_email: str = ""
    admin_password: str = ""

    rate_limit_per_minute: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @property
    def async_database_url(self) -> str:
        """Ensure URL uses asyncpg driver for async operations."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        """Ensure URL uses plain postgresql for sync operations (alembic)."""
        url = self.database_url_sync or self.database_url
        if "+asyncpg" in url:
            url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()
