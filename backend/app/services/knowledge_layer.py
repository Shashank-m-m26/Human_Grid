from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable

from app.agents.contracts import KnowledgeGraphMatch, PeopleDiscoveryOutput
from app.core.errors import DataValidationError, KnowledgeLayerError
from app.models.employee import EmployeeProfile
from app.models.knowledge import CalendarEntry, DepartmentRecord, EnterpriseKnowledgeGraph, NotificationRecord, ProjectRecord, SkillRecord
from app.models.mission import MissionTask
from app.services.json_store import JsonStore


@dataclass
class GraphIndex:
    employees_by_id: dict[str, EmployeeProfile]
    projects_by_id: dict[str, ProjectRecord]
    departments_by_name: dict[str, DepartmentRecord]
    skills_by_name: dict[str, SkillRecord]
    calendar_by_employee: dict[str, CalendarEntry]
    employee_to_projects: dict[str, list[ProjectRecord]]
    skill_to_employees: dict[str, list[EmployeeProfile]]
    department_to_employees: dict[str, list[EmployeeProfile]]


class KnowledgeLayerService:
    def __init__(self, *, store: JsonStore) -> None:
        self.store = store
        self._graph_cache: EnterpriseKnowledgeGraph | None = None
        self._index_cache: GraphIndex | None = None
        self._fingerprint: dict[str, tuple[int, int]] | None = None

    def load_graph(self) -> EnterpriseKnowledgeGraph:
        fingerprint = self.store.fingerprint()
        if self._graph_cache is not None and self._fingerprint == fingerprint:
            return self._graph_cache

        graph = EnterpriseKnowledgeGraph(
            employees=[EmployeeProfile.model_validate(item) for item in self.store.read("employees.json")],
            projects=[ProjectRecord.model_validate(item) for item in self.store.read("projects.json")],
            departments=[DepartmentRecord.model_validate(item) for item in self.store.read("departments.json")],
            skills=[SkillRecord.model_validate(item) for item in self.store.read("skills.json")],
            calendar=[CalendarEntry.model_validate(item) for item in self.store.read("calendar.json")],
            missions=self.store.read("missions.json"),
            notifications=[NotificationRecord.model_validate(item) for item in self.store.read("notifications.json")],
        )
        index = self._build_index(graph)
        self._validate_graph(graph, index)
        self._graph_cache = graph
        self._index_cache = index
        self._fingerprint = fingerprint
        return graph

    def get_index(self) -> GraphIndex:
        self.load_graph()
        if self._index_cache is None:
            raise KnowledgeLayerError("Knowledge graph index failed to initialize.")
        return self._index_cache

    def get_graph_summary(self) -> dict[str, int]:
        graph = self.load_graph()
        return {
            "employees": len(graph.employees),
            "projects": len(graph.projects),
            "departments": len(graph.departments),
            "skills": len(graph.skills),
            "calendar_entries": len(graph.calendar),
            "missions": len(graph.missions),
            "notifications": len(graph.notifications),
        }

    def search_task(self, *, task: MissionTask, objective: str, limit: int = 12) -> PeopleDiscoveryOutput:
        index = self.get_index()
        query_terms = self._normalize_terms([task.title, task.description, objective, *task.required_skills, *task.required_departments])
        match_candidates: list[KnowledgeGraphMatch] = []

        for employee in index.employees_by_id.values():
            overlap = sorted(set(employee.skills) & set(task.required_skills))
            dept_bonus = employee.department in task.required_departments
            searchable = self._normalize_terms([employee.full_name, employee.designation, employee.department, *employee.skills])
            if overlap or dept_bonus or self._term_overlap(query_terms, searchable):
                score = min(1.0, 0.35 + (0.12 * len(overlap)) + (0.15 if dept_bonus else 0.0) + (employee.experience_years / 30))
                reason = f"Matches skills {', '.join(overlap[:3]) or 'through cross-functional signals'} and belongs to {employee.department}."
                relationships = [f"department:{employee.department}", *[f"skill:{skill}" for skill in overlap]]
                match_candidates.append(KnowledgeGraphMatch(entity_type="employee", entity_id=employee.employee_id, label=employee.full_name, relevance_score=round(score * 100, 2), reason=reason, relationships=relationships))

        for project in index.projects_by_id.values():
            technology_overlap = sorted(set(project.technologies) & set(task.required_skills))
            searchable = self._normalize_terms([project.project_name, project.description, project.business_domain, *project.technologies])
            if technology_overlap or project.business_domain in task.required_departments or self._term_overlap(query_terms, searchable):
                score = min(1.0, 0.25 + (0.15 * len(technology_overlap)) + (0.1 if project.business_domain in task.required_departments else 0.0))
                relationships = [f"team_member:{member}" for member in project.team_members[:4]] + [f"technology:{tech}" for tech in technology_overlap]
                match_candidates.append(KnowledgeGraphMatch(entity_type="project", entity_id=project.project_id, label=project.project_name, relevance_score=round(score * 100, 2), reason=f"Project contains relevant technologies {', '.join(technology_overlap[:3]) or 'and adjacent delivery history' }.", relationships=relationships))

        for department in index.departments_by_name.values():
            if department.department_name in task.required_departments or self._term_overlap(query_terms, self._normalize_terms([department.department_name])):
                score = 85.0 if department.department_name in task.required_departments else 55.0
                match_candidates.append(KnowledgeGraphMatch(entity_type="department", entity_id=department.department_name, label=department.department_name, relevance_score=score, reason=f"Department contributes {len(department.employee_ids)} employees to the mission scope.", relationships=[f"manager:{department.manager_id}"]))

        for skill in index.skills_by_name.values():
            searchable = self._normalize_terms([skill.skill_name, skill.category, *skill.related_skills])
            if skill.skill_name in task.required_skills or self._term_overlap(query_terms, searchable):
                score = 90.0 if skill.skill_name in task.required_skills else 50.0
                match_candidates.append(KnowledgeGraphMatch(entity_type="skill", entity_id=skill.skill_name, label=skill.skill_name, relevance_score=score, reason=f"Skill connects to category {skill.category} and related capabilities {', '.join(skill.related_skills[:2])}.", relationships=[f"related:{related}" for related in skill.related_skills[:3]]))

        ranked_matches = sorted(match_candidates, key=lambda item: (-item.relevance_score, item.entity_type, item.label))[:limit]
        candidate_ids = self._resolve_candidate_employee_ids(ranked_matches, task)
        return PeopleDiscoveryOutput(
            candidates_by_task={task.task_id: candidate_ids},
            graph_matches_by_task={task.task_id: ranked_matches},
        )

    def resolve_employee(self, employee_id: str) -> EmployeeProfile:
        index = self.get_index()
        try:
            return index.employees_by_id[employee_id]
        except KeyError as exc:
            raise KnowledgeLayerError(f"Unknown employee id: {employee_id}") from exc

    def resolve_employee_projects(self, employee_id: str) -> list[ProjectRecord]:
        index = self.get_index()
        return index.employee_to_projects.get(employee_id, [])

    def _build_index(self, graph: EnterpriseKnowledgeGraph) -> GraphIndex:
        employees_by_id = {employee.employee_id: employee for employee in graph.employees}
        projects_by_id = {project.project_id: project for project in graph.projects}
        departments_by_name = {department.department_name: department for department in graph.departments}
        skills_by_name = {skill.skill_name: skill for skill in graph.skills}
        calendar_by_employee = {entry.employee_id: entry for entry in graph.calendar}
        employee_to_projects: dict[str, list[ProjectRecord]] = defaultdict(list)
        for project in graph.projects:
            for employee_id in project.team_members:
                employee_to_projects[employee_id].append(project)
        skill_to_employees: dict[str, list[EmployeeProfile]] = defaultdict(list)
        department_to_employees: dict[str, list[EmployeeProfile]] = defaultdict(list)
        for employee in graph.employees:
            department_to_employees[employee.department].append(employee)
            for skill in employee.skills:
                skill_to_employees[skill].append(employee)
        return GraphIndex(
            employees_by_id=employees_by_id,
            projects_by_id=projects_by_id,
            departments_by_name=departments_by_name,
            skills_by_name=skills_by_name,
            calendar_by_employee=calendar_by_employee,
            employee_to_projects=dict(employee_to_projects),
            skill_to_employees=dict(skill_to_employees),
            department_to_employees=dict(department_to_employees),
        )

    def _validate_graph(self, graph: EnterpriseKnowledgeGraph, index: GraphIndex) -> None:
        if len(index.employees_by_id) != len(graph.employees):
            raise DataValidationError("Duplicate employee IDs detected in employees.json.")
        if len(index.projects_by_id) != len(graph.projects):
            raise DataValidationError("Duplicate project IDs detected in projects.json.")
        if len(index.skills_by_name) != len(graph.skills):
            raise DataValidationError("Duplicate skill names detected in skills.json.")
        skill_names = set(index.skills_by_name)
        employee_ids = set(index.employees_by_id)
        for employee in graph.employees:
            unknown_skills = [skill for skill in employee.skills if skill not in skill_names]
            if unknown_skills:
                raise DataValidationError(f"Employee {employee.employee_id} references unknown skills: {unknown_skills}.")
            for project_id in [*employee.completed_projects, *employee.current_projects]:
                if project_id not in index.projects_by_id:
                    raise DataValidationError(f"Employee {employee.employee_id} references unknown project {project_id}.")
        for project in graph.projects:
            invalid_members = [member for member in project.team_members if member not in employee_ids]
            if invalid_members:
                raise DataValidationError(f"Project {project.project_id} references invalid employees: {invalid_members}.")
        for department in graph.departments:
            if department.manager_id not in employee_ids:
                raise DataValidationError(f"Department {department.department_name} has an invalid manager ID.")
            invalid_members = [member for member in department.employee_ids if member not in employee_ids]
            if invalid_members:
                raise DataValidationError(f"Department {department.department_name} references invalid employees: {invalid_members}.")
        for skill in graph.skills:
            invalid_related = [related for related in skill.related_skills if related not in skill_names]
            if invalid_related:
                raise DataValidationError(f"Skill {skill.skill_name} references invalid related skills: {invalid_related}.")
        for calendar_entry in graph.calendar:
            if calendar_entry.employee_id not in employee_ids:
                raise DataValidationError(f"Calendar entry references invalid employee {calendar_entry.employee_id}.")
        for mission in graph.missions:
            requester_id = mission.get("requester_id")
            if requester_id and requester_id not in employee_ids:
                raise DataValidationError(f"Mission {mission.get('mission_id')} references invalid requester {requester_id}.")

    def _resolve_candidate_employee_ids(self, matches: list[KnowledgeGraphMatch], task: MissionTask) -> list[str]:
        index = self.get_index()
        candidate_ids: list[str] = []
        seen = set()
        for match in matches:
            if match.entity_type == "employee":
                ids = [match.entity_id]
            elif match.entity_type == "project":
                ids = index.projects_by_id[match.entity_id].team_members
            elif match.entity_type == "department":
                ids = index.departments_by_name[match.entity_id].employee_ids
            elif match.entity_type == "skill":
                ids = [employee.employee_id for employee in index.skill_to_employees.get(match.entity_id, [])]
            else:
                ids = []
            for employee_id in ids:
                employee = index.employees_by_id.get(employee_id)
                if employee is None:
                    continue
                if task.required_departments and employee.department not in task.required_departments and not (set(employee.skills) & set(task.required_skills)):
                    continue
                if employee_id not in seen:
                    seen.add(employee_id)
                    candidate_ids.append(employee_id)
        return candidate_ids[:10]

    @staticmethod
    def _normalize_terms(values: Iterable[str]) -> set[str]:
        terms: set[str] = set()
        for value in values:
            for token in value.replace('/', ' ').replace('-', ' ').lower().split():
                cleaned = token.strip('.,:;()')
                if cleaned:
                    terms.add(cleaned)
        return terms

    @staticmethod
    def _term_overlap(left: set[str], right: set[str]) -> bool:
        return bool(left & right)
