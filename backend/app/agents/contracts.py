from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.employee import EmployeeProfile
from app.models.mission import MissionEngineState, MissionRecord, MissionTask


class IntentAgentOutput(BaseModel):
    mission: MissionRecord


class MissionPlannerOutput(BaseModel):
    tasks: list[MissionTask] = Field(default_factory=list)


class SkillMapperOutput(BaseModel):
    task_skill_map: dict[str, list[str]] = Field(default_factory=dict)
    task_department_map: dict[str, list[str]] = Field(default_factory=dict)


class KnowledgeGraphMatch(BaseModel):
    entity_type: str
    entity_id: str
    label: str
    relevance_score: float
    reason: str
    relationships: list[str] = Field(default_factory=list)


class PeopleDiscoveryOutput(BaseModel):
    candidates_by_task: dict[str, list[str]] = Field(default_factory=dict)
    graph_matches_by_task: dict[str, list[KnowledgeGraphMatch]] = Field(default_factory=dict)
    searched_domains: list[str] = Field(default_factory=lambda: ["employees", "projects", "departments", "skills"])


class RankedCandidate(BaseModel):
    employee: EmployeeProfile
    ranking_score: float
    confidence_score: float
    explanation: str
    structured_reasoning: list[str] = Field(default_factory=list)


class IntelligenceOutput(BaseModel):
    ranked_candidates_by_task: dict[str, list[RankedCandidate]] = Field(default_factory=dict)


class CoordinationOutput(BaseModel):
    mission_id: str
    assigned_employee_ids: list[str] = Field(default_factory=list)
    scheduled_meeting_ids: list[str] = Field(default_factory=list)
    notification_ids: list[str] = Field(default_factory=list)


class AgentExecutionEvent(BaseModel):
    agent_name: str
    status: str
    summary: str
    started_at: str
    completed_at: str
    duration_ms: int
    reasoning_summary: str
    confidence: float


class MissionTrackerOutput(BaseModel):
    mission_id: str
    status: str
    progress_percent: int = 0
    activity_feed: list[str] = Field(default_factory=list)
    execution_timeline: list[AgentExecutionEvent] = Field(default_factory=list)


class MissionEngineOutput(BaseModel):
    state: MissionEngineState
    execution_timeline: list[AgentExecutionEvent] = Field(default_factory=list)
    root_agent_name: str
    adk_available: bool
    people_discovery: PeopleDiscoveryOutput
    intelligence: IntelligenceOutput
    coordination: CoordinationOutput
