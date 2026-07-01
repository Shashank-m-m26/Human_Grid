from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.mission import router as mission_router
from app.core.errors import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging, log_event
from app.core.settings import get_settings
from app.mcp.server import mcp_server

configure_logging()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="HumanGrid API",
        version="0.1.0",
        description="Mission-driven expert discovery and team coordination backend.",
    )
    app.add_middleware(RequestContextMiddleware)
    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(mission_router)
    app.mount("/mcp", mcp_server.streamable_http_app())

    @app.on_event("startup")
    async def on_startup() -> None:
        app.state.mcp_session_manager = mcp_server.session_manager.run()
        await app.state.mcp_session_manager.__aenter__()
        log_event(
            "info",
            "app_startup",
            service="humangrid-backend",
            gemini_model=settings.gemini_model,
            data_directory=str(settings.data_dir),
            mcp_server="HumanGrid MCP Server",
        )

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        session_manager = getattr(app.state, "mcp_session_manager", None)
        if session_manager is not None:
            await session_manager.__aexit__(None, None, None)

    return app


app = create_app()
