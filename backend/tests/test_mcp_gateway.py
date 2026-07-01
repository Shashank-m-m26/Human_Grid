from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from app.core.errors import HumanGridError
from app.core.settings import get_settings
from app.models.mcp import (
    CalendarCheckInput,
    DepartmentSearchInput,
    EmployeeProfileInput,
    EmployeeSearchInput,
    MissionCreateToolInput,
    MissionProgressInput,
    MissionStatusUpdateInput,
    NotifyEmployeeInput,
    ProjectHistoryInput,
    ProjectSearchInput,
    ReminderEmployeeInput,
    ScheduleMeetingInput,
    SkillDistributionInput,
    SkillSearchInput,
    TeamBalanceInput,
    WorkloadSummaryInput,
)
from app.services.analytics_service import AnalyticsService
from app.services.calendar_ops import CalendarOpsService
from app.services.intelligence_engine import IntelligenceEngine
from app.services.json_store import JsonStore
from app.services.knowledge_layer import KnowledgeLayerService
from app.services.mcp_gateway import MCPGatewayService
from app.services.mission_engine import MissionEngineService
from app.services.mission_ops import MissionOpsService
from app.services.notification_ops import NotificationOpsService


class MCPGatewayTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        source = Path(__file__).resolve().parents[1] / "data"
        target = Path(self.temp_dir.name) / "data"
        shutil.copytree(source, target)
        self.store = JsonStore(target)
        self.knowledge_layer = KnowledgeLayerService(store=self.store)
        self.intelligence_engine = IntelligenceEngine(knowledge_layer=self.knowledge_layer)
        self.mission_engine = MissionEngineService(
            settings=get_settings(),
            store=self.store,
            knowledge_layer=self.knowledge_layer,
            intelligence_engine=self.intelligence_engine,
        )
        self.gateway = MCPGatewayService(
            knowledge_layer=self.knowledge_layer,
            mission_engine=self.mission_engine,
            mission_ops=MissionOpsService(store=self.store),
            calendar_ops=CalendarOpsService(store=self.store),
            notification_ops=NotificationOpsService(store=self.store),
            analytics_service=AnalyticsService(knowledge_layer=self.knowledge_layer),
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_search_employees(self) -> None:
        result = self.gateway.search_employees(EmployeeSearchInput(caller_agent="People Discovery Agent", skills=["FastAPI"], department="Engineering"))
        self.assertGreater(len(result.matches), 0)

    def test_get_employee_profile_and_availability(self) -> None:
        profile = self.gateway.get_employee_profile(EmployeeProfileInput(caller_agent="People Discovery Agent", employee_id="emp-001"))
        availability = self.gateway.get_employee_availability(EmployeeProfileInput(caller_agent="Coordinator Agent", employee_id="emp-001"))
        self.assertEqual(profile.employee_id, "emp-001")
        self.assertEqual(availability.employee_id, "emp-001")

    def test_project_tools(self) -> None:
        search = self.gateway.search_similar_projects(ProjectSearchInput(caller_agent="People Discovery Agent", technologies=["Kubernetes"], business_domain="DevOps"))
        history = self.gateway.get_project_history(ProjectHistoryInput(caller_agent="People Discovery Agent", project_id="proj-001"))
        self.assertGreater(len(search.matches), 0)
        self.assertEqual(history.project.project_id, "proj-001")

    def test_department_and_skill_tools(self) -> None:
        dept = self.gateway.search_department(DepartmentSearchInput(caller_agent="People Discovery Agent", department_name="Engineering"))
        skill = self.gateway.search_skill(SkillSearchInput(caller_agent="People Discovery Agent", skill_name="FastAPI"))
        self.assertEqual(dept.department_name, "Engineering")
        self.assertEqual(skill.skill_name, "FastAPI")

    def test_create_mission_and_progress(self) -> None:
        created = self.gateway.create_mission(MissionCreateToolInput(caller_agent="Coordinator Agent", requester_id="emp-001", prompt="I need reviewers for my client demo."))
        mission_id = created.mission.state.mission.mission_id
        progress = self.gateway.get_mission_progress(MissionProgressInput(caller_agent="Mission Tracker Agent", mission_id=mission_id))
        self.assertEqual(progress.mission_id, mission_id)
        self.assertGreaterEqual(progress.completion_percentage, 0)

    def test_update_mission_status(self) -> None:
        result = self.gateway.update_mission_status(MissionStatusUpdateInput(caller_agent="Coordinator Agent", mission_id="mission-c930b1a05fd7", new_status="Scheduled"))
        self.assertEqual(result.new_status, "Scheduled")

    def test_calendar_tools(self) -> None:
        checked = self.gateway.check_calendar(CalendarCheckInput(caller_agent="Coordinator Agent", employee_ids=["emp-001"], date="2026-07-01"))
        scheduled = self.gateway.schedule_meeting(ScheduleMeetingInput(caller_agent="Coordinator Agent", employee_ids=["emp-001", "emp-002"], date="2026-07-01", start="10:00", end="11:00", title="Mission Sync"))
        self.assertEqual(len(checked.entries), 1)
        self.assertGreater(len(scheduled.scheduled_employee_ids), 0)

    def test_notification_tools(self) -> None:
        notice = self.gateway.notify_employee(NotifyEmployeeInput(caller_agent="Coordinator Agent", employee_id="emp-001", mission_id="mission-c930b1a05fd7", type="Mission Assigned", message="Mission assigned."))
        reminder = self.gateway.remind_employee(ReminderEmployeeInput(caller_agent="Coordinator Agent", employee_id="emp-001", mission_id="mission-c930b1a05fd7", message="Please confirm availability."))
        self.assertEqual(notice.status, "delivered")
        self.assertEqual(reminder.status, "delivered")

    def test_analytics_tools(self) -> None:
        workload = self.gateway.workload_summary(WorkloadSummaryInput(caller_agent="Mission Tracker Agent"))
        skills = self.gateway.skill_distribution(SkillDistributionInput(caller_agent="Mission Tracker Agent"))
        balance = self.gateway.team_balance(TeamBalanceInput(caller_agent="Mission Tracker Agent", employee_ids=["emp-001", "emp-017", "emp-029"]))
        self.assertGreater(len(workload.departments), 0)
        self.assertGreater(len(skills.skills), 0)
        self.assertGreater(balance.diversity_score, 0)

    def test_permissions_are_enforced(self) -> None:
        with self.assertRaises(HumanGridError):
            self.gateway.search_employees(EmployeeSearchInput(caller_agent="Coordinator Agent", skills=["FastAPI"]))


if __name__ == "__main__":
    unittest.main()
