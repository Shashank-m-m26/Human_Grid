from fastapi import APIRouter

from app.agents.root import get_mission_engine_bundle
from app.api.dependencies import get_knowledge_layer
from app.core.settings import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def healthcheck() -> dict[str, object]:
    settings = get_settings()
    bundle = get_mission_engine_bundle()
    knowledge = get_knowledge_layer()
    summary = knowledge.get_graph_summary()
    return {
        "status": "ok",
        "service": "humangrid-backend",
        "gemini_model": settings.gemini_model,
        "gemini_api_key_loaded": bool(settings.gemini_api_key),
        "adk_available": bundle.adk_available,
        "root_agent_name": bundle.root_agent_name,
        "agent_count": len(bundle.agent_names),
        "adk_import_error": bundle.import_error,
        "knowledge_graph": summary,
        "mcp_server": {
            "name": "HumanGrid MCP Server",
            "path": "/mcp",
            "status": "mounted",
        },
    }
