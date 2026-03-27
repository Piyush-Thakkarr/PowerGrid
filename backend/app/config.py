from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://powergrid:powergrid123@aws-1-ap-northeast-1.pooler.supabase.com:5432/powergrid"
    database_url_sync: str = "postgresql://powergrid:powergrid123@aws-1-ap-northeast-1.pooler.supabase.com:5432/powergrid"

    supabase_jwt_secret: str = "super-secret-jwt-token-with-at-least-32-characters-long"

    cors_origins: str = "http://localhost:5173"

    admin_email: str = "admin@powergrid.in"
    admin_password: str = "admin123"

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
