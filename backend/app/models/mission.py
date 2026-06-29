from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

MISSION_STAGES = ("Created", "Planning", "Searching", "Ranking", "Assigned", "Scheduled", "Completed")
MissionStage = Literal["Created", "Planning", "Searching", "Ranking", "Assigned", "Scheduled", "Completed"]


class MissionEngineRequest(BaseModel):
    requester_id: str
    prompt: str = Field(min_length=5, max_length=1000)


MissionRequest = MissionEngineRequest


class MissionTask(BaseModel):
    task_id: str
    title: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    required_departments: list[str] = Field(default_factory=list)
    estimated_duration: str = "TBD"
    status: str = "pending"


class MissionStageEvent(BaseModel):
    stage: MissionStage
    transitioned_at: str


class MissionRecord(BaseModel):
    mission_id: str
    requester_id: str
    title: str
    objective: str
    status: MissionStage = "Created"
    priority: str = "normal"
    created_at: str
    tasks: list[MissionTask] = Field(default_factory=list)
    team_member_ids: list[str] = Field(default_factory=list)
    stage_history: list[MissionStageEvent] = Field(default_factory=list)


class MissionEngineState(BaseModel):
    mission: MissionRecord
    current_agent: str | None = None
    current_stage: MissionStage = "Created"
    activity_feed: list[str] = Field(default_factory=list)
