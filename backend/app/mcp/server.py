from __future__ import annotations

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError

from app.api.dependencies import get_mcp_gateway
from app.core.errors import HumanGridError
from app.models.mcp import (
    CalendarCheckInput,
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
    SkillDistributionOutput,
    SkillSearchInput,
    SkillSearchOutput,
    TeamBalanceInput,
    TeamBalanceOutput,
    WorkloadSummaryInput,
    WorkloadSummaryOutput,
)
from app.models.employee import EmployeeProfile

mcp_server = FastMCP("HumanGrid MCP Server", stateless_http=True, json_response=True)
mcp_server.settings.streamable_http_path = "/"


def _tool_call(fn, payload):
    try:
        return fn(payload)
    except HumanGridError as exc:
        raise ToolError(exc.message) from exc


@mcp_server.tool()
def search_employees(payload: EmployeeSearchInput) -> EmployeeSearchOutput:
    """Search employees by skills, department, experience, availability, certifications, and languages."""
    return _tool_call(get_mcp_gateway().search_employees, payload)


@mcp_server.tool()
def get_employee_profile(payload: EmployeeProfileInput) -> EmployeeProfile:
    """Return the complete employee profile for a valid employee id."""
    return _tool_call(get_mcp_gateway().get_employee_profile, payload)


@mcp_server.tool()
def get_employee_availability(payload: EmployeeProfileInput) -> EmployeeAvailabilityOutput:
    """Return employee availability, workload, and preferred meeting hours."""
    return _tool_call(get_mcp_gateway().get_employee_availability, payload)


@mcp_server.tool()
def search_similar_projects(payload: ProjectSearchInput) -> ProjectSearchOutput:
    """Search historical enterprise projects by technologies, domain, and required skills."""
    return _tool_call(get_mcp_gateway().search_similar_projects, payload)


@mcp_server.tool()
def get_project_history(payload: ProjectHistoryInput) -> ProjectHistoryOutput:
    """Return project history, technologies, participating employees, and status."""
    return _tool_call(get_mcp_gateway().get_project_history, payload)


@mcp_server.tool()
def search_department(payload: DepartmentSearchInput) -> DepartmentSearchOutput:
    """Return department details including manager, employees, and workload."""
    return _tool_call(get_mcp_gateway().search_department, payload)


@mcp_server.tool()
def search_skill(payload: SkillSearchInput) -> SkillSearchOutput:
    """Return skill category, related skills, and employees possessing the skill."""
    return _tool_call(get_mcp_gateway().search_skill, payload)


@mcp_server.tool()
def create_mission(payload: MissionCreateToolInput) -> MCPMissionCreateOutput:
    """Create a mission through the existing Mission Engine."""
    return _tool_call(get_mcp_gateway().create_mission, payload)


@mcp_server.tool()
def update_mission_status(payload: MissionStatusUpdateInput) -> MissionStatusUpdateOutput:
    """Update the mission state machine using only valid forward transitions."""
    return _tool_call(get_mcp_gateway().update_mission_status, payload)


@mcp_server.tool()
def get_mission_progress(payload: MissionProgressInput) -> MissionProgressOutput:
    """Return mission stage, completion percentage, assigned employees, and pending tasks."""
    return _tool_call(get_mcp_gateway().get_mission_progress, payload)


@mcp_server.tool()
def check_calendar(payload: CalendarCheckInput) -> CalendarCheckOutput:
    """Return employee availability and meeting slots for a supported date."""
    return _tool_call(get_mcp_gateway().check_calendar, payload)


@mcp_server.tool()
def schedule_meeting(payload: ScheduleMeetingInput) -> ScheduleMeetingOutput:
    """Schedule a meeting and reject employee conflicts."""
    return _tool_call(get_mcp_gateway().schedule_meeting, payload)


@mcp_server.tool()
def notify_employee(payload: NotifyEmployeeInput) -> NotifyEmployeeOutput:
    """Store a mission or meeting notification for an employee."""
    return _tool_call(get_mcp_gateway().notify_employee, payload)


@mcp_server.tool()
def remind_employee(payload: ReminderEmployeeInput) -> NotifyEmployeeOutput:
    """Generate a reminder notification for an employee."""
    return _tool_call(get_mcp_gateway().remind_employee, payload)


@mcp_server.tool()
def workload_summary(payload: WorkloadSummaryInput) -> WorkloadSummaryOutput:
    """Return workload summaries grouped by department."""
    return _tool_call(get_mcp_gateway().workload_summary, payload)


@mcp_server.tool()
def skill_distribution(payload: SkillDistributionInput) -> SkillDistributionOutput:
    """Return enterprise skill distribution statistics."""
    return _tool_call(get_mcp_gateway().skill_distribution, payload)


@mcp_server.tool()
def team_balance(payload: TeamBalanceInput) -> TeamBalanceOutput:
    """Analyze team diversity using departments, experience, workload, and collaboration score."""
    return _tool_call(get_mcp_gateway().team_balance, payload)


def main() -> None:
    mcp_server.run(transport="streamable-http")


if __name__ == "__main__":
    main()
