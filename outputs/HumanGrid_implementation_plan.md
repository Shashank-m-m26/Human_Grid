# HumanGrid Implementation Plan

## Phase 0: Locked Scope
- Build only the MVP features defined in the playbook.
- Preserve the seven-agent architecture and JSON-based knowledge store.
- Use prototype-first execution locally before any deployment decisions.
- Extend the current scaffold compatibly instead of reshaping the architecture.

## Phase 1: Foundation
- Set up frontend and backend project structure.
- Define shared mission, employee, ranking, activity, and Mission Engine data contracts.
- Initialize JSON knowledge files and secure JSON access helpers.
- Add FastAPI app bootstrap, basic auth hooks, validation, logging, and error handling.

## Phase 2: Knowledge Layer
- Model enterprise data for employees, projects, calendars, departments, skills, notifications, and missions.
- Generate realistic seed data for about 100 employees across required departments.
- Implement indexed JSON readers for search, profile lookup, availability checks, department relationships, skill relationships, and project history lookup.
- Treat enterprise knowledge as a complete discovery graph spanning employees, projects, departments, and skills.

## Phase 3: MCP Server
- Implement one Python MCP server with the required tools.
- Keep employee/project/calendar/mission/notification/analytics tool boundaries explicit.
- Restrict direct MCP usage to the People Discovery Agent and Coordinator Agent pathways.
- Expose the graph-backed discovery data needed by the People Discovery Agent without changing the existing MCP tool list.

## Phase 4: Agent System
- Implement the Root ADK orchestrator.
- Implement the seven named agents with strict role boundaries:
  - Intent Agent
  - Mission Planner Agent
  - Skill Mapper Agent
  - People Discovery Agent
  - Intelligence Agent
  - Coordinator Agent
  - Mission Tracker Agent
- Define the handoff contracts between every stage.
- Drive orchestration through the Mission Engine internal flow and stream agent execution events for the timeline UI.

## Phase 5: Mission Flow
- Build the end-to-end Mission Engine pipeline from intake to dashboard state.
- Add ranking logic using skills, experience, prior projects, collaboration score, trust score, workload, and availability.
- Ensure every employee recommendation includes a human-readable explanation, confidence score, and structured reasoning.

## Phase 6: Frontend Experience
- Build a non-chat landing page with mission-first UX.
- Add animated network background and futuristic enterprise dashboard styling.
- Add a Mission Command Center page as the primary mission operations view.
- Implement an Agent Execution Timeline that visualizes every AI agent in real time.
- Implement mission submission, live agent pipeline visualization, recommended team cards, progress view, activity feed, and intelligence explanation panels.

## Phase 7: Hardening
- Add prompt injection protection and input sanitization.
- Expand audit logging and failure handling.
- Validate JSON schema consistency and mission state transitions.
- Validate timeline event integrity and recommendation explanation completeness.

## Phase 8: Manual Verification
- Run local app and playground flows.
- Manually verify:
  - mission creation
  - Mission Engine execution
  - agent timeline rendering
  - ranking explanations and confidence
  - coordination actions
  - dashboard and command center progress rendering

## Immediate Next Tasks
- Complete backend foundation and Mission Engine contracts.
- Seed the enterprise JSON knowledge graph.
- Stand up the MCP server surface.
