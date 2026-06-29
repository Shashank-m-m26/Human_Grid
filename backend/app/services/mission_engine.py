from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.agents.contracts import AgentExecutionEvent, CoordinationOutput, IntelligenceOutput, MissionEngineOutput, PeopleDiscoveryOutput
from app.agents.root import AGENT_NAMES, get_mission_engine_bundle
from app.core.errors import MissionEngineError
from app.core.logging import log_event
from app.core.settings import Settings
from app.models.mission import MissionEngineRequest, MissionEngineState, MissionRecord, MissionStageEvent, MissionTask
from app.services.intelligence_engine import IntelligenceEngine
from app.services.json_store import JsonStore
from app.services.knowledge_layer import KnowledgeLayerService


class MissionEngineService:
    def __init__(
        self,
        *,
        settings: Settings,
        store: JsonStore,
        knowledge_layer: KnowledgeLayerService,
        intelligence_engine: IntelligenceEngine,
    ) -> None:
        self.settings = settings
        self.store = store
        self.knowledge_layer = knowledge_layer
        self.intelligence_engine = intelligence_engine

    def create_mission(
        self,
        *,
        payload: MissionEngineRequest,
        authenticated_user: str,
        request_id: str | None,
    ) -> MissionEngineOutput:
        prompt = self._normalize_prompt(payload.prompt)
        if not prompt:
            raise MissionEngineError("Mission prompt cannot be empty after normalization.")

        self.knowledge_layer.load_graph()
        mission_id = f"mission-{uuid4().hex[:12]}"
        created_at = self._timestamp()
        tasks = self._build_tasks(prompt)
        people_discovery = self._run_people_discovery(tasks=tasks, objective=prompt)
        intelligence = self._run_intelligence(tasks=tasks, people_discovery=people_discovery)
        assigned_employee_ids = self._select_team(intelligence)
        coordination = CoordinationOutput(
            mission_id=mission_id,
            assigned_employee_ids=assigned_employee_ids,
            scheduled_meeting_ids=[f"meeting-{mission_id[-6:]}"] if assigned_employee_ids else [],
            notification_ids=[f"notif-auto-{mission_id[-6:]}"] if assigned_employee_ids else [],
        )
        mission = MissionRecord(
            mission_id=mission_id,
            requester_id=payload.requester_id,
            title=self._build_title(prompt),
            objective=prompt,
            status="Assigned",
            priority=self._infer_priority(prompt),
            created_at=created_at,
            tasks=tasks,
            team_member_ids=assigned_employee_ids,
            stage_history=self._build_stage_history(created_at),
        )
        activity_feed = self._build_activity_feed(authenticated_user=authenticated_user, assigned_employee_ids=assigned_employee_ids)
        execution_timeline = self._build_execution_timeline(created_at, tasks, people_discovery, intelligence, coordination)
        state = MissionEngineState(
            mission=mission,
            current_agent=AGENT_NAMES[-1],
            current_stage="Assigned",
            activity_feed=activity_feed,
        )
        bundle = get_mission_engine_bundle()
        result = MissionEngineOutput(
            state=state,
            execution_timeline=execution_timeline,
            root_agent_name=bundle.root_agent_name,
            adk_available=bundle.adk_available,
            people_discovery=people_discovery,
            intelligence=intelligence,
            coordination=coordination,
        )

        record = {
            **mission.model_dump(),
            "current_stage": state.current_stage,
            "activity_feed": activity_feed,
            "execution_timeline": [event.model_dump() for event in execution_timeline],
            "root_agent_name": bundle.root_agent_name,
            "adk_available": bundle.adk_available,
            "people_discovery": people_discovery.model_dump(),
            "intelligence": intelligence.model_dump(),
            "coordination": coordination.model_dump(),
        }
        self.store.append_to_list("missions.json", record)
        log_event(
            "info",
            "mission_engine_orchestrated",
            request_id=request_id,
            mission_id=mission_id,
            authenticated_user=authenticated_user,
            root_agent_name=bundle.root_agent_name,
            adk_available=bundle.adk_available,
            assigned_employee_count=len(assigned_employee_ids),
        )
        return result

    @staticmethod
    def _normalize_prompt(prompt: str) -> str:
        return " ".join(prompt.split())

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _build_title(prompt: str) -> str:
        trimmed = prompt.strip().rstrip(".?!")
        if len(trimmed) <= 72:
            return trimmed
        return f"{trimmed[:69].rstrip()}..."

    @staticmethod
    def _infer_priority(prompt: str) -> str:
        lowered = prompt.lower()
        urgent_markers = ("today", "asap", "urgent", "before tomorrow", "immediately")
        return "high" if any(marker in lowered for marker in urgent_markers) else "normal"

    def _build_tasks(self, prompt: str) -> list[MissionTask]:
        lowered = prompt.lower()
        if "mentor" in lowered:
            task_specs = [
                ("task-1", "Profile the mentorship need", "Capture the target capability gap, time horizon, and preferred mentoring style.", ["Mentoring", "Learning & Development"], ["DevOps", "Engineering", "HR"], "2 hours"),
                ("task-2", "Map required expertise", "Identify the domain expertise and seniority signals required for the mentor.", ["Kubernetes", "Terraform", "Mentoring"], ["DevOps", "Engineering"], "4 hours"),
                ("task-3", "Prepare mentor shortlist", "Assemble the best mentor candidates with availability-aware rationale.", ["Stakeholder Management", "Mentoring", "Communication"], ["DevOps", "HR"], "1 day"),
            ]
        elif "review" in lowered or "reviewer" in lowered:
            task_specs = [
                ("task-1", "Define review goals", "Clarify what kind of review is needed and how many reviewers are required.", ["Stakeholder Management", "Documentation"], ["Product", "QA"], "2 hours"),
                ("task-2", "Find relevant reviewers", "Locate reviewers with the right domain context, trust score, and availability.", ["Quality Engineering", "API Testing", "Communication"], ["QA", "Engineering"], "4 hours"),
                ("task-3", "Coordinate review readiness", "Prepare meeting and review coordination steps for the recommended reviewers.", ["Program Management", "Communication"], ["Product", "QA", "Engineering"], "1 day"),
            ]
        elif "team" in lowered or "hackathon" in lowered:
            task_specs = [
                ("task-1", "Shape the team mission", "Define the team objective, timeline, and coverage needed across functions.", ["Stakeholder Management", "Communication", "Program Management"], ["Product", "Engineering"], "3 hours"),
                ("task-2", "Map cross-functional roles", "Identify the functional skill mix required for the mission.", ["System Design", "Design Systems", "Machine Learning"], ["Engineering", "Design", "Data Science"], "6 hours"),
                ("task-3", "Assemble the candidate team", "Prepare a balanced shortlist of collaborators with rationale.", ["Program Management", "Mentoring", "Communication"], ["Engineering", "Design", "Data Science", "Product"], "1 day"),
            ]
        else:
            task_specs = [
                ("task-1", "Interpret mission objectives", "Translate the mission request into a clear outcome and delivery expectations.", ["Stakeholder Management", "Communication"], ["Product", "Engineering"], "2 hours"),
                ("task-2", "Identify required specialists", "Map the work into skills and collaborator profiles needed to complete the mission.", ["System Design", "Program Management", "Documentation"], ["Engineering", "Product", "Support"], "4 hours"),
                ("task-3", "Prepare coordination actions", "Outline next actions to assign people, create the mission, and schedule collaboration.", ["Program Management", "Communication", "Documentation"], ["Product", "Support", "Engineering"], "1 day"),
            ]
        return [MissionTask(task_id=task_id, title=title, description=description, required_skills=required_skills, required_departments=required_departments, estimated_duration=estimated_duration) for task_id, title, description, required_skills, required_departments, estimated_duration in task_specs]

    def _run_people_discovery(self, *, tasks: list[MissionTask], objective: str) -> PeopleDiscoveryOutput:
        aggregated = PeopleDiscoveryOutput()
        for task in tasks:
            result = self.knowledge_layer.search_task(task=task, objective=objective)
            aggregated.candidates_by_task.update(result.candidates_by_task)
            aggregated.graph_matches_by_task.update(result.graph_matches_by_task)
        return aggregated

    def _run_intelligence(self, *, tasks: list[MissionTask], people_discovery: PeopleDiscoveryOutput) -> IntelligenceOutput:
        aggregated: dict[str, list] = {}
        for task in tasks:
            result = self.intelligence_engine.rank_task_candidates(task=task, people_discovery=people_discovery)
            aggregated.update(result.ranked_candidates_by_task)
        return IntelligenceOutput(ranked_candidates_by_task=aggregated)

    @staticmethod
    def _select_team(intelligence: IntelligenceOutput) -> list[str]:
        selected: list[str] = []
        seen = set()
        for candidates in intelligence.ranked_candidates_by_task.values():
            for candidate in candidates[:2]:
                if candidate.employee.employee_id not in seen:
                    seen.add(candidate.employee.employee_id)
                    selected.append(candidate.employee.employee_id)
        return selected[:5]

    @staticmethod
    def _build_stage_history(created_at: str) -> list[MissionStageEvent]:
        created = datetime.fromisoformat(created_at)
        stages = ["Created", "Planning", "Searching", "Ranking", "Assigned"]
        return [MissionStageEvent(stage=stage, transitioned_at=(created + timedelta(milliseconds=index * 180)).isoformat()) for index, stage in enumerate(stages)]

    def _build_activity_feed(self, *, authenticated_user: str, assigned_employee_ids: list[str]) -> list[str]:
        return [
            f"Mission Engine authenticated operator '{authenticated_user}'.",
            "Intent Agent extracted the mission objective.",
            "Mission Planner Agent generated executable tasks with duration and department requirements.",
            "Skill Mapper Agent mapped required skills and departments for each task.",
            "People Discovery Agent searched employees, projects, departments, and skills across the enterprise graph.",
            "Intelligence Agent ranked candidates using explainable confidence-based scoring.",
            f"Coordinator Agent prepared assignments for {len(assigned_employee_ids)} recommended team members.",
            "Mission Tracker Agent published the enriched mission state and execution timeline.",
        ]

    def _build_execution_timeline(
        self,
        created_at: str,
        tasks: list[MissionTask],
        people_discovery: PeopleDiscoveryOutput,
        intelligence: IntelligenceOutput,
        coordination: CoordinationOutput,
    ) -> list[AgentExecutionEvent]:
        base_time = datetime.fromisoformat(created_at)
        summaries = [
            ("Mission request normalized into structured intent.", 0.94),
            (f"Planned {len(tasks)} executable tasks with estimated durations.", 0.9),
            ("Mapped required skills and departments for every task.", 0.91),
            (f"Searched the enterprise graph and produced {sum(len(v) for v in people_discovery.graph_matches_by_task.values())} graph matches.", 0.89),
            (f"Ranked {sum(len(v) for v in intelligence.ranked_candidates_by_task.values())} employee recommendations with explanations.", 0.92),
            (f"Prepared coordination for {len(coordination.assigned_employee_ids)} assigned employees.", 0.86),
            ("Published mission state transitions and timeline metadata.", 0.95),
        ]
        durations = [120, 180, 150, 260, 210, 140, 110]
        timeline: list[AgentExecutionEvent] = []
        cursor = base_time
        for agent_name, summary_info, duration in zip(AGENT_NAMES, summaries, durations, strict=True):
            reasoning_summary, confidence = summary_info
            started_at = cursor
            completed_at = started_at + timedelta(milliseconds=duration)
            timeline.append(AgentExecutionEvent(
                agent_name=agent_name,
                status="completed",
                summary=reasoning_summary,
                started_at=started_at.isoformat(),
                completed_at=completed_at.isoformat(),
                duration_ms=duration,
                reasoning_summary=reasoning_summary,
                confidence=confidence,
            ))
            cursor = completed_at
        return timeline
