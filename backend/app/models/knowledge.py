from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.employee import EmployeeProfile, MeetingHours


class ProjectRecord(BaseModel):
    project_id: str
    project_name: str
    description: str
    technologies: list[str] = Field(default_factory=list)
    team_members: list[str] = Field(default_factory=list)
    project_status: str
    completion_date: str | None = None
    business_domain: str


class SkillRecord(BaseModel):
    skill_name: str
    category: str
    related_skills: list[str] = Field(default_factory=list)
    proficiency_levels: list[str] = Field(default_factory=list)


class DepartmentRecord(BaseModel):
    department_name: str
    manager_id: str
    employee_ids: list[str] = Field(default_factory=list)


class AvailabilitySlot(BaseModel):
    start: str
    end: str
    status: str


class CalendarDay(BaseModel):
    date: str
    slots: list[AvailabilitySlot] = Field(default_factory=list)


class CalendarEntry(BaseModel):
    employee_id: str
    today: CalendarDay
    tomorrow: CalendarDay
    preferred_meeting_hours: MeetingHours


class NotificationRecord(BaseModel):
    notification_id: str
    employee_id: str
    mission_id: str | None = None
    type: str
    message: str
    status: str
    timestamp: str


class EnterpriseKnowledgeGraph(BaseModel):
    employees: list[EmployeeProfile] = Field(default_factory=list)
    projects: list[ProjectRecord] = Field(default_factory=list)
    departments: list[DepartmentRecord] = Field(default_factory=list)
    skills: list[SkillRecord] = Field(default_factory=list)
    calendar: list[CalendarEntry] = Field(default_factory=list)
    missions: list[dict] = Field(default_factory=list)
    notifications: list[NotificationRecord] = Field(default_factory=list)
