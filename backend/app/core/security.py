from __future__ import annotations

from secrets import compare_digest

from fastapi import Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.core.errors import AuthenticationError
from app.core.settings import get_settings

security = HTTPBasic(auto_error=False)


def require_basic_auth(credentials: HTTPBasicCredentials | None = Depends(security)) -> str:
    settings = get_settings()
    if credentials is None:
        raise AuthenticationError("Authentication is required.")
    username_matches = compare_digest(credentials.username, settings.basic_auth_username)
    password_matches = compare_digest(credentials.password, settings.basic_auth_password)
    if not (username_matches and password_matches):
        raise AuthenticationError()
    return credentials.username
