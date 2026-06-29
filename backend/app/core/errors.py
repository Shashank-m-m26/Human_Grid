from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import log_event


class HumanGridError(Exception):
    def __init__(self, message: str, *, error_code: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


class AuthenticationError(HumanGridError):
    def __init__(self, message: str = "Invalid authentication credentials.") -> None:
        super().__init__(message, error_code="authentication_error", status_code=status.HTTP_401_UNAUTHORIZED)


class JsonStoreError(HumanGridError):
    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="json_store_error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MissionEngineError(HumanGridError):
    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="mission_engine_error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KnowledgeLayerError(HumanGridError):
    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="knowledge_layer_error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataValidationError(HumanGridError):
    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="data_validation_error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _error_body(request_id: str | None, *, message: str, error_code: str) -> dict[str, Any]:
    return {
        "error": {
            "code": error_code,
            "message": message,
            "request_id": request_id,
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HumanGridError)
    async def handle_humangrid_error(request: Request, exc: HumanGridError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        log_event(
            "warning",
            "handled_application_error",
            request_id=request_id,
            error_code=exc.error_code,
            detail=exc.message,
        )
        headers = {"WWW-Authenticate": "Basic"} if exc.status_code == status.HTTP_401_UNAUTHORIZED else None
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(request_id, message=exc.message, error_code=exc.error_code),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        log_event(
            "warning",
            "request_validation_error",
            request_id=request_id,
            detail=exc.errors(),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_body(request_id, message="Request validation failed.", error_code="validation_error"),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        log_event(
            "error",
            "unhandled_exception",
            request_id=request_id,
            error_type=type(exc).__name__,
            detail=str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body(request_id, message="An unexpected backend error occurred.", error_code="internal_error"),
        )
