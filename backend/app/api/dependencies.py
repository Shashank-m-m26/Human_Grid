from functools import lru_cache

from app.core.settings import Settings, get_settings
from app.services.intelligence_engine import IntelligenceEngine
from app.services.json_store import JsonStore
from app.services.knowledge_layer import KnowledgeLayerService
from app.services.mission_engine import MissionEngineService


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
