from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.core.settings import get_settings

try:
    from google.adk.agents import Agent, SequentialAgent
except Exception as exc:  # pragma: no cover - defensive startup guard
    Agent = None
    SequentialAgent = None
    ADK_IMPORT_ERROR = str(exc)
else:
    ADK_IMPORT_ERROR = None


AGENT_NAMES = (
    "Intent Agent",
    "Mission Planner Agent",
    "Skill Mapper Agent",
    "People Discovery Agent",
    "Intelligence Agent",
    "Coordinator Agent",
    "Mission Tracker Agent",
)


@dataclass(frozen=True)
class MissionEngineBundle:
    root_agent_name: str
    agent_names: tuple[str, ...]
    model: str
    adk_available: bool
    root_agent: Any | None
    import_error: str | None = None


ROOT_AGENT_NAME = "Mission Engine Root"


if Agent is not None:
    def _create_llm_agent(*, name: str, description: str, instruction: str, output_key: str) -> Any:
        settings = get_settings()
        return Agent(
            name=name,
            model=settings.gemini_model,
            description=description,
            instruction=instruction,
            output_key=output_key,
        )


    def create_intent_agent() -> Any:
        return _create_llm_agent(
            name="intent_agent",
            description="Extracts structured mission intent from the user request.",
            instruction=(
                "You are the Intent Agent for HumanGrid. Interpret the mission request, "
                "extract the objective, urgency, and collaboration need, and store a structured mission summary. "
                "You must not call MCP directly. Route operational needs back through the Mission Engine Root."
            ),
            output_key="intent_agent_output",
        )


    def create_mission_planner_agent() -> Any:
        return _create_llm_agent(
            name="mission_planner_agent",
            description="Converts the mission into executable tasks.",
            instruction=(
                "You are the Mission Planner Agent for HumanGrid. Break the mission into clear, executable tasks "
                "that can be assigned to specialists. You must not call MCP directly."
            ),
            output_key="mission_planner_output",
        )


    def create_skill_mapper_agent() -> Any:
        return _create_llm_agent(
            name="skill_mapper_agent",
            description="Maps each mission task to the required capabilities.",
            instruction=(
                "You are the Skill Mapper Agent for HumanGrid. Identify the skills, domains, and cross-functional "
                "collaboration required for every mission task. You must not call MCP directly."
            ),
            output_key="skill_mapper_output",
        )


    def create_people_discovery_agent() -> Any:
        return _create_llm_agent(
            name="people_discovery_agent",
            description="Discovers relevant candidates from the enterprise knowledge graph through MCP.",
            instruction=(
                "You are the People Discovery Agent for HumanGrid. Search across employees, projects, departments, "
                "and skills through the MCP server only. Use MCP employee, project, department, and skill tools directly."
            ),
            output_key="people_discovery_output",
        )


    def create_intelligence_agent() -> Any:
        return _create_llm_agent(
            name="intelligence_agent",
            description="Ranks candidates and explains every recommendation.",
            instruction=(
                "You are the Intelligence Agent for HumanGrid. Rank candidates using skills, experience, project history, "
                "trust, collaboration, workload, and availability. Produce confidence scores and explicit reasoning. "
                "Do not call MCP directly; use Mission Engine context from People Discovery and Coordinator outputs."
            ),
            output_key="intelligence_output",
        )


    def create_coordinator_agent() -> Any:
        return _create_llm_agent(
            name="coordinator_agent",
            description="Coordinates assignments, scheduling, notifications, and mission actions through MCP.",
            instruction=(
                "You are the Coordinator Agent for HumanGrid. Prepare mission assignments, suggested meetings, mission updates, "
                "and notification actions through the MCP server only."
            ),
            output_key="coordination_output",
        )


    def create_mission_tracker_agent() -> Any:
        return _create_llm_agent(
            name="mission_tracker_agent",
            description="Tracks mission progress and dashboard state with read-only MCP access.",
            instruction=(
                "You are the Mission Tracker Agent for HumanGrid. Summarize mission progress, track state transitions, "
                "and emit dashboard-ready updates. You may use only read-only MCP progress and analytics tools."
            ),
            output_key="mission_tracker_output",
        )


    @lru_cache(maxsize=1)
    def create_root_mission_engine() -> Any:
        return SequentialAgent(
            name="mission_engine_root",
            sub_agents=[
                create_intent_agent(),
                create_mission_planner_agent(),
                create_skill_mapper_agent(),
                create_people_discovery_agent(),
                create_intelligence_agent(),
                create_coordinator_agent(),
                create_mission_tracker_agent(),
            ],
        )
else:
    def create_root_mission_engine() -> None:
        return None


@lru_cache(maxsize=1)
def get_mission_engine_bundle() -> MissionEngineBundle:
    settings = get_settings()
    root_agent = create_root_mission_engine()
    return MissionEngineBundle(
        root_agent_name=ROOT_AGENT_NAME,
        agent_names=AGENT_NAMES,
        model=settings.gemini_model,
        adk_available=root_agent is not None,
        root_agent=root_agent,
        import_error=ADK_IMPORT_ERROR,
    )


root_agent = create_root_mission_engine()
