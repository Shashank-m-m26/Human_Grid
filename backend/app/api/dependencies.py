from functools import lru_cache

from app.core.settings import Settings, get_settings
from app.services.analytics_service import AnalyticsService
from app.services.calendar_ops import CalendarOpsService
from app.services.intelligence_engine import IntelligenceEngine
from app.services.json_store import JsonStore
from app.services.knowledge_layer import KnowledgeLayerService
from app.services.mcp_gateway import MCPGatewayService
from app.services.mission_engine import MissionEngineService
from app.services.mission_ops import MissionOpsService
from app.services.notification_ops import NotificationOpsService


@lru_cache(maxsize=1)
def get_json_store() -> JsonStore:
    settings = get_settings()
    return JsonStore(settings.data_dir)


@lru_cache(maxsize=1)
def get_knowledge_layer() -> KnowledgeLayerService:
    return KnowledgeLayerService(store=get_json_store())


@lru_cache(maxsize=1)
def get_intelligence_engine() -> IntelligenceEngine:
    return IntelligenceEngine(knowledge_layer=get_knowledge_layer())


@lru_cache(maxsize=1)
def get_mission_ops_service() -> MissionOpsService:
    return MissionOpsService(store=get_json_store())


@lru_cache(maxsize=1)
def get_calendar_ops_service() -> CalendarOpsService:
    return CalendarOpsService(store=get_json_store())


@lru_cache(maxsize=1)
def get_notification_ops_service() -> NotificationOpsService:
    return NotificationOpsService(store=get_json_store())


@lru_cache(maxsize=1)
def get_analytics_service() -> AnalyticsService:
    return AnalyticsService(knowledge_layer=get_knowledge_layer())


@lru_cache(maxsize=1)
def get_mission_engine_service() -> MissionEngineService:
    settings: Settings = get_settings()
    store = get_json_store()
    knowledge_layer = get_knowledge_layer()
    intelligence_engine = get_intelligence_engine()
    return MissionEngineService(
        settings=settings,
        store=store,
        knowledge_layer=knowledge_layer,
        intelligence_engine=intelligence_engine,
    )


@lru_cache(maxsize=1)
def get_mcp_gateway() -> MCPGatewayService:
    return MCPGatewayService(
        knowledge_layer=get_knowledge_layer(),
        mission_engine=get_mission_engine_service(),
        mission_ops=get_mission_ops_service(),
        calendar_ops=get_calendar_ops_service(),
        notification_ops=get_notification_ops_service(),
        analytics_service=get_analytics_service(),
    )
