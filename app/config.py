"""
Application configuration.

Reads settings from environment variables / a `.env` file using
pydantic-settings. Import `get_settings()` anywhere a config value is
needed rather than re-reading `os.environ` directly.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/transitops_db"
    )

    jwt_secret_key: str = "change_this_to_a_long_random_string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    environment: str = "development"

    max_failed_login_attempts: int = 5
    account_lock_minutes: int = 15

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
