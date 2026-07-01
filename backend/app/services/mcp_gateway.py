from __future__ import annotations

import time

from app.agents.contracts import KnowledgeGraphMatch
from app.agents.root import ROOT_AGENT_NAME
from app.core.errors import KnowledgeLayerError, MissionEngineError
from app.core.logging import log_event
from app.models.employee import EmployeeProfile
from app.models.mcp import (
    CalendarCheckInput,
    CalendarCheckItem,
    CalendarCheckOutput,
    DepartmentSearchInput,
    DepartmentSearchOutput,
    EmployeeAvailabilityOutput,
    EmployeeProfileInput,
    EmployeeSearchInput,
    EmployeeSearchOutput,
    MCPMissionCreateOutput,
    MissionCreateToolInput,
    MissionProgressInput,
    MissionProgressOutput,
    MissionStatusUpdateInput,
    MissionStatusUpdateOutput,
    NotifyEmployeeInput,
    NotifyEmployeeOutput,
    ProjectHistoryInput,
    ProjectHistoryOutput,
    ProjectSearchInput,
    ProjectSearchOutput,
    ReminderEmployeeInput,
    ScheduleMeetingInput,
    ScheduleMeetingOutput,
    SkillDistributionInput,
    SkillDistributionItem,
    SkillDistributionOutput,
    SkillSearchInput,
    SkillSearchOutput,
    TeamBalanceInput,
    TeamBalanceOutput,
    WorkloadSummaryInput,
    WorkloadSummaryItem,
    WorkloadSummaryOutput,
)
from app.models.mission import MissionEngineRequest
from app.services.analytics_service import AnalyticsService
from app.services.calendar_ops import CalendarOpsService
from app.services.knowledge_layer import KnowledgeLayerService
from app.services.mission_engine import MissionEngineService
from app.services.mission_ops import MissionOpsService
from app.services.notification_ops import NotificationOpsService


class MCPGatewayService:
    def __init__(
        self,
        *,
        knowledge_layer: KnowledgeLayerService,
        mission_engine: MissionEngineService,
        mission_ops: MissionOpsService,
        calendar_ops: CalendarOpsService,
        notification_ops: NotificationOpsService,
        analytics_service: AnalyticsService,
    ) -> None:
        self.knowledge_layer = knowledge_layer
        self.mission_engine = mission_engine
        self.mission_ops = mission_ops
        self.calendar_ops = calendar_ops
        self.notification_ops = notification_ops
        self.analytics_service = analytics_service
        self.permissions = {
            "search_employees": {ROOT_AGENT_NAME, "People Discovery Agent"},
            "get_employee_profile": {ROOT_AGENT_NAME, "People Discovery Agent", "Coordinator Agent"},
            "get_employee_availability": {ROOT_AGENT_NAME, "People Discovery Agent", "Coordinator Agent", "Mission Tracker Agent"},
            "search_similar_projects": {ROOT_AGENT_NAME, "People Discovery Agent"},
            "get_project_history": {ROOT_AGENT_NAME, "People Discovery Agent"},
            "search_department": {ROOT_AGENT_NAME, "People Discovery Agent"},
            "search_skill": {ROOT_AGENT_NAME, "People Discovery Agent"},
            "create_mission": {ROOT_AGENT_NAME, "Coordinator Agent"},
            "update_mission_status": {ROOT_AGENT_NAME, "Coordinator Agent"},
            "get_mission_progress": {ROOT_AGENT_NAME, "Mission Tracker Agent", "Coordinator Agent"},
            "check_calendar": {ROOT_AGENT_NAME, "Coordinator Agent", "Mission Tracker Agent"},
            "schedule_meeting": {ROOT_AGENT_NAME, "Coordinator Agent"},
            "notify_employee": {ROOT_AGENT_NAME, "Coordinator Agent"},
            "remind_employee": {ROOT_AGENT_NAME, "Coordinator Agent"},
            "workload_summary": {ROOT_AGENT_NAME, "Mission Tracker Agent"},
            "skill_distribution": {ROOT_AGENT_NAME, "Mission Tracker Agent"},
            "team_balance": {ROOT_AGENT_NAME, "Mission Tracker Agent", "Coordinator Agent"},
        }

    def _authorize(self, tool_name: str, caller_agent: str) -> None:
        allowed = self.permissions.get(tool_name, set())
        if caller_agent not in allowed:
            raise KnowledgeLayerError(f"Caller agent '{caller_agent}' is not permitted to invoke {tool_name}.")

    def _run(self, tool_name: str, caller_agent: str, func):
        self._authorize(tool_name, caller_agent)
        started = time.perf_counter()
        try:
            result = func()
            elapsed = round((time.perf_counter() - started) * 1000, 2)
            log_event("info", "mcp_tool_executed", tool_name=tool_name, caller_agent=caller_agent, execution_time_ms=elapsed, status="ok")
            return result
        except Exception:
            elapsed = round((time.perf_counter() - started) * 1000, 2)
            log_event("warning", "mcp_tool_executed", tool_name=tool_name, caller_agent=caller_agent, execution_time_ms=elapsed, status="error")
            raise

    def search_employees(self, payload: EmployeeSearchInput) -> EmployeeSearchOutput:
        def execute() -> EmployeeSearchOutput:
            graph = self.knowledge_layer.load_graph()
            matches: list[KnowledgeGraphMatch] = []
            for employee in graph.employees:
                if payload.department and employee.department != payload.department:
                    continue
                if employee.experience_years < payload.min_experience_years:
                    continue
                if payload.availability and employee.availability != payload.availability:
                    continue
                if payload.skills and not set(payload.skills).issubset(set(employee.skills)):
                    continue
                if payload.certifications and not set(payload.certifications).issubset(set(employee.certifications)):
                    continue
                if payload.languages and not set(payload.languages).issubset(set(employee.languages)):
                    continue
                score = 50 + (len(set(payload.skills) & set(employee.skills)) * 8) + min(employee.experience_years, 15)
                matches.append(KnowledgeGraphMatch(entity_type="employee", entity_id=employee.employee_id, label=employee.full_name, relevance_score=round(score, 2), reason=f"Employee matches requested search filters in {employee.department}.", relationships=[f"department:{employee.department}", *[f"skill:{skill}" for skill in employee.skills[:3]]]))
            matches.sort(key=lambda item: (-item.relevance_score, item.label))
            return EmployeeSearchOutput(matches=matches[: payload.limit])
        return self._run("search_employees", payload.caller_agent, execute)

    def get_employee_profile(self, payload: EmployeeProfileInput) -> EmployeeProfile:
        return self._run("get_employee_profile", payload.caller_agent, lambda: self.knowledge_layer.resolve_employee(payload.employee_id))

    def get_employee_availability(self, payload: EmployeeProfileInput) -> EmployeeAvailabilityOutput:
        def execute() -> EmployeeAvailabilityOutput:
            employee = self.knowledge_layer.resolve_employee(payload.employee_id)
            return EmployeeAvailabilityOutput(employee_id=employee.employee_id, availability=employee.availability, current_workload=employee.current_workload, preferred_meeting_hours=employee.preferred_meeting_hours)
        return self._run("get_employee_availability", payload.caller_agent, execute)

    def search_similar_projects(self, payload: ProjectSearchInput) -> ProjectSearchOutput:
        def execute() -> ProjectSearchOutput:
            graph = self.knowledge_layer.load_graph()
            desired = set(payload.technologies) | set(payload.required_skills)
            matches: list[KnowledgeGraphMatch] = []
            for project in graph.projects:
                overlap = desired & set(project.technologies)
                if payload.business_domain and project.business_domain != payload.business_domain and not overlap:
                    continue
                if desired and not overlap and project.business_domain != payload.business_domain:
                    continue
                score = 40 + (len(overlap) * 12) + (15 if payload.business_domain and project.business_domain == payload.business_domain else 0)
                matches.append(KnowledgeGraphMatch(entity_type="project", entity_id=project.project_id, label=project.project_name, relevance_score=round(score, 2), reason=f"Project overlaps requested technologies and domain history.", relationships=[f"technology:{tech}" for tech in list(overlap)[:4]] + [f"member:{member}" for member in project.team_members[:3]]))
            matches.sort(key=lambda item: (-item.relevance_score, item.label))
            return ProjectSearchOutput(matches=matches[: payload.limit])
        return self._run("search_similar_projects", payload.caller_agent, execute)

    def get_project_history(self, payload: ProjectHistoryInput) -> ProjectHistoryOutput:
        def execute() -> ProjectHistoryOutput:
            index = self.knowledge_layer.get_index()
            if payload.project_id not in index.projects_by_id:
                raise KnowledgeLayerError(f"Unknown project id: {payload.project_id}")
            project = index.projects_by_id[payload.project_id]
            participants = [self.knowledge_layer.resolve_employee(employee_id) for employee_id in project.team_members]
            return ProjectHistoryOutput(project=project, participating_employees=participants)
        return self._run("get_project_history", payload.caller_agent, execute)

    def search_department(self, payload: DepartmentSearchInput) -> DepartmentSearchOutput:
        def execute() -> DepartmentSearchOutput:
            index = self.knowledge_layer.get_index()
            if payload.department_name not in index.departments_by_name:
                raise KnowledgeLayerError(f"Unknown department: {payload.department_name}")
            department = index.departments_by_name[payload.department_name]
            employees = [self.knowledge_layer.resolve_employee(employee_id) for employee_id in department.employee_ids]
            manager = self.knowledge_layer.resolve_employee(department.manager_id)
            avg_workload = round(sum(employee.current_workload for employee in employees) / len(employees), 2)
            return DepartmentSearchOutput(department_name=department.department_name, manager=manager, employees=employees, current_workload=avg_workload)
        return self._run("search_department", payload.caller_agent, execute)

    def search_skill(self, payload: SkillSearchInput) -> SkillSearchOutput:
        def execute() -> SkillSearchOutput:
            index = self.knowledge_layer.get_index()
            if payload.skill_name not in index.skills_by_name:
                raise KnowledgeLayerError(f"Unknown skill: {payload.skill_name}")
            skill = index.skills_by_name[payload.skill_name]
            employees = index.skill_to_employees.get(payload.skill_name, [])[: payload.limit]
            return SkillSearchOutput(skill_name=skill.skill_name, category=skill.category, related_skills=skill.related_skills, employees=employees)
        return self._run("search_skill", payload.caller_agent, execute)

    def create_mission(self, payload: MissionCreateToolInput) -> MCPMissionCreateOutput:
        def execute() -> MCPMissionCreateOutput:
            mission = self.mission_engine.create_mission(payload=MissionEngineRequest(requester_id=payload.requester_id, prompt=payload.prompt), authenticated_user=f"mcp:{payload.caller_agent}", request_id=None)
            return MCPMissionCreateOutput(mission=mission)
        return self._run("create_mission", payload.caller_agent, execute)

    def update_mission_status(self, payload: MissionStatusUpdateInput) -> MissionStatusUpdateOutput:
        def execute() -> MissionStatusUpdateOutput:
            previous_status, new_status = self.mission_ops.update_status(mission_id=payload.mission_id, new_status=payload.new_status)
            return MissionStatusUpdateOutput(mission_id=payload.mission_id, previous_status=previous_status, new_status=new_status)
        return self._run("update_mission_status", payload.caller_agent, execute)

    def get_mission_progress(self, payload: MissionProgressInput) -> MissionProgressOutput:
        def execute() -> MissionProgressOutput:
            progress = self.mission_ops.get_progress(mission_id=payload.mission_id)
            return MissionProgressOutput(**progress)
        return self._run("get_mission_progress", payload.caller_agent, execute)

    def check_calendar(self, payload: CalendarCheckInput) -> CalendarCheckOutput:
        def execute() -> CalendarCheckOutput:
            employee_index = {employee.employee_id: employee.model_dump() for employee in self.knowledge_layer.load_graph().employees}
            entries = self.calendar_ops.check(employee_ids=payload.employee_ids, date=payload.date, employee_index=employee_index)
            return CalendarCheckOutput(entries=[CalendarCheckItem(**entry) for entry in entries])
        return self._run("check_calendar", payload.caller_agent, execute)

    def schedule_meeting(self, payload: ScheduleMeetingInput) -> ScheduleMeetingOutput:
        def execute() -> ScheduleMeetingOutput:
            result = self.calendar_ops.schedule(employee_ids=payload.employee_ids, date=payload.date, start=payload.start, end=payload.end, title=payload.title)
            return ScheduleMeetingOutput(**result)
        return self._run("schedule_meeting", payload.caller_agent, execute)

    def notify_employee(self, payload: NotifyEmployeeInput) -> NotifyEmployeeOutput:
        def execute() -> NotifyEmployeeOutput:
            self.knowledge_layer.resolve_employee(payload.employee_id)
            result = self.notification_ops.create(employee_id=payload.employee_id, mission_id=payload.mission_id, notification_type=payload.type, message=payload.message)
            return NotifyEmployeeOutput(**result)
        return self._run("notify_employee", payload.caller_agent, execute)

    def remind_employee(self, payload: ReminderEmployeeInput) -> NotifyEmployeeOutput:
        def execute() -> NotifyEmployeeOutput:
            self.knowledge_layer.resolve_employee(payload.employee_id)
            result = self.notification_ops.create(employee_id=payload.employee_id, mission_id=payload.mission_id, notification_type="Reminder", message=payload.message)
            return NotifyEmployeeOutput(**result)
        return self._run("remind_employee", payload.caller_agent, execute)

    def workload_summary(self, payload: WorkloadSummaryInput) -> WorkloadSummaryOutput:
        def execute() -> WorkloadSummaryOutput:
            rows = self.analytics_service.workload_summary()
            return WorkloadSummaryOutput(departments=[WorkloadSummaryItem(**row) for row in rows])
        return self._run("workload_summary", payload.caller_agent, execute)

    def skill_distribution(self, payload: SkillDistributionInput) -> SkillDistributionOutput:
        def execute() -> SkillDistributionOutput:
            rows = self.analytics_service.skill_distribution()
            return SkillDistributionOutput(skills=[SkillDistributionItem(**row) for row in rows])
        return self._run("skill_distribution", payload.caller_agent, execute)

    def team_balance(self, payload: TeamBalanceInput) -> TeamBalanceOutput:
        def execute() -> TeamBalanceOutput:
            for employee_id in payload.employee_ids:
                self.knowledge_layer.resolve_employee(employee_id)
            result = self.analytics_service.team_balance(employee_ids=payload.employee_ids)
            return TeamBalanceOutput(**result)
        return self._run("team_balance", payload.caller_agent, execute)
