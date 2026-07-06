HumanGrid Concierge
Your Enterprise AI Concierge for Connecting the Right People and Completing the Right Mission
Competition Track

Concierge Agents

Problem Statement

Modern enterprises have thousands of employees spread across multiple departments, projects, and geographical locations. While organizations possess tremendous expertise, employees often struggle to identify the right person for a specific task.

Typical questions include:

Who can mentor me in DevOps?
Who has previously worked on Kubernetes deployments?
Who can review my client presentation?
Who is available this week for a cross-functional hackathon?

Traditional employee directories only provide static information such as names, job titles, and departments. They cannot understand user intent, reason about mission requirements, or intelligently recommend the most suitable people.

This leads to wasted time, duplicated effort, and slower collaboration.

Why an AI Concierge?

HumanGrid Concierge reimagines enterprise collaboration as a concierge experience.

Instead of asking users to search for people, the system asks a different question:

"What mission are you trying to accomplish today?"

The user describes the desired outcome in natural language, and the AI Concierge orchestrates specialized agents to understand the request, discover experts, coordinate collaboration, and continuously track progress.

The result is a mission-first experience rather than a directory-first experience.

Why Multi-Agent AI?

A single AI model can answer questions, but enterprise mission execution requires specialized reasoning.

HumanGrid Concierge divides the workflow into seven focused agents, each responsible for a single stage of execution.

The workflow consists of:

Intent Agent – Understands the mission.
Mission Planner Agent – Breaks the mission into executable tasks.
Skill Mapper Agent – Determines required skills and departments.
People Discovery Agent – Searches enterprise knowledge.
Intelligence Agent – Ranks candidates using explainable scoring.
Coordinator Agent – Coordinates the selected employees.
Mission Tracker Agent – Tracks mission execution and updates progress.

This modular architecture improves maintainability, transparency, and extensibility while reflecting how complex enterprise workflows operate in practice.

Why MCP?

Enterprise AI systems should not directly access organizational data.

HumanGrid Concierge uses the Model Context Protocol (MCP) as a secure interaction layer between AI agents and enterprise knowledge.

Rather than querying underlying data sources directly, authorized agents invoke standardized MCP tools for capabilities such as:

Employee discovery
Project intelligence
Availability checking
Mission lifecycle management
Calendar coordination
Notification orchestration
Workload analysis
Team composition

The MCP Gateway also enforces permission checks so that each agent can access only the capabilities required for its responsibilities.

This architecture closely resembles how enterprise systems expose services through controlled interfaces.

System Architecture

HumanGrid Concierge consists of four major layers.

Presentation Layer

A modern Next.js dashboard provides a Mission Command Center where users submit missions and visualize execution.

Mission Orchestration Layer

Google ADK coordinates seven specialized AI agents through a sequential workflow.

Enterprise Integration Layer

The MCP Server exposes enterprise capabilities through standardized tools while enforcing authorization and structured request logging.

Enterprise Knowledge Layer

Organizational knowledge is modeled across employees, projects, departments, skills, mission history, collaboration metrics, and availability, enabling contextual reasoning throughout the mission lifecycle.

Explainable AI

A major design goal of HumanGrid Concierge is transparency.

Candidate recommendations are not treated as black-box outputs.

Each recommendation includes:

confidence score
skill match
experience
trust score
collaboration score
workload
availability
reasoning summary

This enables users to understand why specific employees were recommended for a mission.

Dashboard Experience

The Mission Command Center provides a complete visualization of mission execution through several interactive widgets.

These include:

Mission Timeline
Agent Execution Timeline
Recommended Team
Mission Progress
Activity Feed
Intelligence Explanation
Enterprise Knowledge Graph

Together, these components allow users to observe every stage of the AI orchestration process rather than simply receiving a final answer.

Technologies Used
Backend
Python
FastAPI
Google ADK
Gemini 2.5 Flash
Model Context Protocol (MCP)
Pydantic
Frontend
Next.js
React
TailwindCSS
Framer Motion
shadcn/ui
Knowledge Layer

A structured enterprise knowledge model representing employees, departments, projects, organizational skills, availability, and mission history.

Sample Mission

Example user request:

"I need a DevOps mentor before tomorrow."

Execution Flow:

User Request

↓

Intent Agent

↓

Mission Planner

↓

Skill Mapper

↓

People Discovery

↓

MCP Gateway

↓

Enterprise Knowledge Layer

↓

Intelligence Agent

↓

Coordinator

↓

Mission Tracker

↓

Mission Command Center

The dashboard then displays the recommended experts, reasoning behind each recommendation, mission progress, and execution timeline.

Innovation

HumanGrid Concierge moves beyond conversational AI by introducing a mission-oriented enterprise concierge.

Instead of simply answering questions, it orchestrates specialized AI agents to understand objectives, discover organizational expertise, coordinate execution, and provide transparent decision-making.

The combination of Google ADK, MCP, explainable AI, and an interactive Mission Command Center demonstrates how agentic AI can improve enterprise collaboration while remaining modular, secure, and extensible.

Impact

HumanGrid Concierge can benefit organizations by:

reducing the time required to locate expertise,
improving cross-functional collaboration,
increasing knowledge reuse,
enabling explainable AI-assisted decision-making, and
providing a scalable foundation for enterprise AI concierge systems.
What I Learned

This project provided hands-on experience designing a production-style multi-agent architecture using Google ADK, integrating Model Context Protocol services, building a modern FastAPI and Next.js application, and creating explainable AI workflows for enterprise collaboration.

It also reinforced the importance of modular agent design, secure tool invocation, and user-centric AI experiences.