from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str

    clerk_secret_key: str = ""
    clerk_domain: str = "grown-javelin-87.clerk.accounts.dev"

    cors_origins: str = "http://localhost:5173,https://power-grid-ruddy.vercel.app"

    session_secret: str = ""
    admin_email: str = ""
    admin_password: str = ""

    rate_limit_per_minute: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
