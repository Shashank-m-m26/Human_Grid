from __future__ import annotations

from pydantic import BaseModel, Field


class MeetingHours(BaseModel):
    start: str
    end: str
    timezone: str = "Asia/Calcutta"


class EmployeeProfile(BaseModel):
    employee_id: str
    full_name: str
    designation: str
    department: str
    office_location: str
    experience_years: int = 0
    skills: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    availability: str = "unknown"
    preferred_meeting_hours: MeetingHours
    current_workload: int = 0
    trust_score: float = 0.0
    collaboration_score: float = 0.0
    mentor_score: float = 0.0
    communication_style: str = "structured and collaborative"
    completed_projects: list[str] = Field(default_factory=list)
    current_projects: list[str] = Field(default_factory=list)

    @property
    def role(self) -> str:
        return self.designation
