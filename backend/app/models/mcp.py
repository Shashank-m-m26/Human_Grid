from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.agents.contracts import KnowledgeGraphMatch, MissionEngineOutput
from app.models.employee import EmployeeProfile, MeetingHours
from app.models.knowledge import ProjectRecord
from app.models.mission import MissionStage, MissionTask

CallerAgent = Literal["Mission Engine Root", "People Discovery Agent", "Coordinator Agent", "Mission Tracker Agent"]


class EmployeeSearchInput(BaseModel):
    caller_agent: CallerAgent
    skills: list[str] = Field(default_factory=list)
    department: str | None = None
    min_experience_years: int = 0
    availability: str | None = None
    certifications: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=25)


class EmployeeSearchOutput(BaseModel):
    matches: list[KnowledgeGraphMatch] = Field(default_factory=list)


class EmployeeProfileInput(BaseModel):
    caller_agent: CallerAgent
    employee_id: str


class EmployeeAvailabilityOutput(BaseModel):
    employee_id: str
    availability: str
    current_workload: int
    preferred_meeting_hours: MeetingHours


class ProjectSearchInput(BaseModel):
    caller_agent: CallerAgent
    technologies: list[str] = Field(default_factory=list)
    business_domain: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=25)


class ProjectSearchOutput(BaseModel):
    matches: list[KnowledgeGraphMatch] = Field(default_factory=list)


class ProjectHistoryInput(BaseModel):
    caller_agent: CallerAgent
    project_id: str


class ProjectHistoryOutput(BaseModel):
    project: ProjectRecord
    participating_employees: list[EmployeeProfile] = Field(default_factory=list)


class DepartmentSearchInput(BaseModel):
    caller_agent: CallerAgent
    department_name: str


class DepartmentSearchOutput(BaseModel):
    department_name: str
    manager: EmployeeProfile
    employees: list[EmployeeProfile] = Field(default_factory=list)
    current_workload: float


class SkillSearchInput(BaseModel):
    caller_agent: CallerAgent
    skill_name: str
    limit: int = Field(default=10, ge=1, le=25)


class SkillSearchOutput(BaseModel):
    skill_name: str
    category: str
    related_skills: list[str] = Field(default_factory=list)
    employees: list[EmployeeProfile] = Field(default_factory=list)


class MissionCreateToolInput(BaseModel):
    caller_agent: CallerAgent
    requester_id: str
    prompt: str = Field(min_length=5, max_length=1000)


class MissionStatusUpdateInput(BaseModel):
    caller_agent: CallerAgent
    mission_id: str
    new_status: MissionStage


class MissionStatusUpdateOutput(BaseModel):
    mission_id: str
    previous_status: MissionStage
    new_status: MissionStage


class MissionProgressInput(BaseModel):
    caller_agent: CallerAgent
    mission_id: str


class MissionProgressOutput(BaseModel):
    mission_id: str
    current_stage: MissionStage
    completion_percentage: int
    assigned_employees: list[str] = Field(default_factory=list)
    pending_tasks: list[MissionTask] = Field(default_factory=list)


class CalendarCheckInput(BaseModel):
    caller_agent: CallerAgent
    employee_ids: list[str] = Field(default_factory=list)
    date: str


class CalendarCheckItem(BaseModel):
    employee_id: str
    availability: str
    workload: int
    preferred_meeting_hours: MeetingHours
    slots: list[dict[str, str]] = Field(default_factory=list)


class CalendarCheckOutput(BaseModel):
    entries: list[CalendarCheckItem] = Field(default_factory=list)


class ScheduleMeetingInput(BaseModel):
    caller_agent: CallerAgent
    employee_ids: list[str] = Field(default_factory=list)
    date: str
    start: str
    end: str
    title: str
    mission_id: str | None = None


class ScheduleMeetingOutput(BaseModel):
    meeting_id: str
    scheduled_employee_ids: list[str] = Field(default_factory=list)
    conflicted_employee_ids: list[str] = Field(default_factory=list)
    date: str
    start: str
    end: str
    title: str


class NotifyEmployeeInput(BaseModel):
    caller_agent: CallerAgent
    employee_id: str
    mission_id: str | None = None
    type: Literal["Mission Assigned", "Meeting Scheduled", "Reminder", "Mission Completed"]
    message: str = Field(min_length=3, max_length=500)


class NotifyEmployeeOutput(BaseModel):
    notification_id: str
    status: str


class ReminderEmployeeInput(BaseModel):
    caller_agent: CallerAgent
    employee_id: str
    mission_id: str | None = None
    message: str = Field(min_length=3, max_length=500)


class WorkloadSummaryInput(BaseModel):
    caller_agent: CallerAgent


class WorkloadSummaryItem(BaseModel):
    department_name: str
    employee_count: int
    average_workload: float


class WorkloadSummaryOutput(BaseModel):
    departments: list[WorkloadSummaryItem] = Field(default_factory=list)


class SkillDistributionInput(BaseModel):
    caller_agent: CallerAgent


class SkillDistributionItem(BaseModel):
    skill_name: str
    employee_count: int
    category: str


class SkillDistributionOutput(BaseModel):
    skills: list[SkillDistributionItem] = Field(default_factory=list)


class TeamBalanceInput(BaseModel):
    caller_agent: CallerAgent
    employee_ids: list[str] = Field(default_factory=list)


class TeamBalanceOutput(BaseModel):
    department_distribution: dict[str, int] = Field(default_factory=dict)
    average_experience_years: float
    average_workload: float
    average_collaboration_score: float
    diversity_score: float


class MCPMissionCreateOutput(BaseModel):
    mission: MissionEngineOutput
