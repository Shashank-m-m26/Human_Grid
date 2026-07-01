from __future__ import annotations

from app.core.errors import MissionEngineError
from app.models.mission import MISSION_STAGES, MissionStage, MissionTask
from app.services.json_store import JsonStore


class MissionOpsService:
    def __init__(self, *, store: JsonStore) -> None:
        self.store = store

    def update_status(self, *, mission_id: str, new_status: MissionStage) -> tuple[MissionStage, MissionStage]:
        missions = self.store.read("missions.json")
        for mission in missions:
            if mission.get("mission_id") != mission_id:
                continue
            current_status = mission.get("current_stage") or mission.get("status")
            if current_status not in MISSION_STAGES:
                raise MissionEngineError(f"Mission {mission_id} has an invalid current stage.")
            current_index = MISSION_STAGES.index(current_status)
            target_index = MISSION_STAGES.index(new_status)
            if target_index != current_index + 1:
                raise MissionEngineError(f"Invalid mission state transition from {current_status} to {new_status}.")
            mission["status"] = new_status
            mission["current_stage"] = new_status
            mission.setdefault("stage_history", []).append({
                "stage": new_status,
                "transitioned_at": mission.get("created_at"),
            })
            self.store.write("missions.json", missions)
            return current_status, new_status
        raise MissionEngineError(f"Unknown mission id: {mission_id}")

    def get_progress(self, *, mission_id: str) -> dict[str, object]:
        missions = self.store.read("missions.json")
        for mission in missions:
            if mission.get("mission_id") != mission_id:
                continue
            current_stage = mission.get("current_stage") or mission.get("status")
            if current_stage not in MISSION_STAGES:
                raise MissionEngineError(f"Mission {mission_id} has an invalid current stage.")
            completion = int((MISSION_STAGES.index(current_stage) / (len(MISSION_STAGES) - 1)) * 100)
            pending_tasks = [MissionTask.model_validate(task) for task in mission.get("tasks", []) if task.get("status") != "completed"]
            return {
                "mission_id": mission_id,
                "current_stage": current_stage,
                "completion_percentage": completion,
                "assigned_employees": mission.get("team_member_ids", []),
                "pending_tasks": pending_tasks,
            }
        raise MissionEngineError(f"Unknown mission id: {mission_id}")
