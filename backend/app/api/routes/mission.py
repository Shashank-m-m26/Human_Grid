from fastapi import APIRouter, Depends, Request, status

from app.agents.contracts import MissionEngineOutput
from app.api.dependencies import get_mission_engine_service
from app.core.logging import log_event
from app.core.security import require_basic_auth
from app.models.mission import MissionEngineRequest
from app.services.mission_engine import MissionEngineService

router = APIRouter(tags=["mission"])


@router.post("/mission", response_model=MissionEngineOutput, status_code=status.HTTP_201_CREATED)
def create_mission(
    payload: MissionEngineRequest,
    request: Request,
    authenticated_user: str = Depends(require_basic_auth),
    mission_engine: MissionEngineService = Depends(get_mission_engine_service),
) -> MissionEngineOutput:
    result = mission_engine.create_mission(
        payload=payload,
        authenticated_user=authenticated_user,
        request_id=getattr(request.state, "request_id", None),
    )
    log_event(
        "info",
        "mission_created",
        request_id=getattr(request.state, "request_id", None),
        mission_id=result.state.mission.mission_id,
        authenticated_user=authenticated_user,
    )
    return result
