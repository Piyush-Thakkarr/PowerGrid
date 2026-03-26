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


@lru_cache()
def get_settings() -> Settings:
    return Settings()
