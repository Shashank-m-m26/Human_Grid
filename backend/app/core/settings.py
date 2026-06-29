from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore", case_sensitive=False)

    gemini_api_key: str = Field(alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash")
    basic_auth_username: str = Field(default="admin", alias="BASIC_AUTH_USERNAME")
    basic_auth_password: str = Field(default="humangrid", alias="BASIC_AUTH_PASSWORD")
    audit_log_name: str = Field(default="humangrid")

    @property
    def data_dir(self) -> Path:
        return BASE_DIR / "data"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
