from __future__ import annotations

from app.agents.contracts import IntelligenceOutput, PeopleDiscoveryOutput, RankedCandidate
from app.models.mission import MissionTask
from app.services.knowledge_layer import KnowledgeLayerService


class IntelligenceEngine:
    def __init__(self, *, knowledge_layer: KnowledgeLayerService) -> None:
        self.knowledge_layer = knowledge_layer

    def rank_task_candidates(
        self,
        *,
        task: MissionTask,
        people_discovery: PeopleDiscoveryOutput,
    ) -> IntelligenceOutput:
        ranked: list[RankedCandidate] = []
        for employee_id in people_discovery.candidates_by_task.get(task.task_id, []):
            employee = self.knowledge_layer.resolve_employee(employee_id)
            related_projects = self.knowledge_layer.resolve_employee_projects(employee_id)
            skill_overlap = len(set(employee.skills) & set(task.required_skills))
            skill_ratio = skill_overlap / max(len(task.required_skills), 1)
            experience_component = min(employee.experience_years / 12, 1.0)
            project_relevance = 0.0
            project_reasons = []
            for project in related_projects:
                overlap = set(project.technologies) & set(task.required_skills)
                if overlap or project.business_domain in task.required_departments:
                    project_relevance += 0.25
                    project_reasons.append(f"Worked on {project.project_name} using {', '.join(sorted(overlap)[:2]) or project.business_domain}.")
            project_relevance = min(project_relevance, 1.0)
            trust_component = employee.trust_score / 100
            collaboration_component = employee.collaboration_score / 100
            workload_component = max(0.0, (100 - employee.current_workload) / 100)
            availability_component = {"available": 1.0, "limited": 0.65, "busy": 0.35}.get(employee.availability, 0.25)
            ranking_score = round((skill_ratio * 32 + experience_component * 14 + project_relevance * 12 + trust_component * 14 + collaboration_component * 12 + workload_component * 8 + availability_component * 8), 2)
            confidence_score = round(min(ranking_score / 100, 0.99), 2)
            structured_reasoning = [
                f"Skill coverage: {skill_overlap} of {len(task.required_skills)} required skills matched.",
                f"Experience: {employee.experience_years} years in {employee.department}.",
                f"Trust and collaboration: {employee.trust_score}/100 trust, {employee.collaboration_score}/100 collaboration.",
                f"Workload and availability: workload {employee.current_workload}/100 and availability {employee.availability}.",
            ]
            structured_reasoning.extend(project_reasons[:2])
            explanation = f"{employee.full_name} is a strong fit for {task.title} with {skill_overlap} matching skills, {employee.experience_years} years of experience, and a confidence score of {confidence_score}."
            ranked.append(RankedCandidate(
                employee=employee,
                ranking_score=ranking_score,
                confidence_score=confidence_score,
                explanation=explanation,
                structured_reasoning=structured_reasoning,
            ))
        ranked.sort(key=lambda candidate: (-candidate.ranking_score, -candidate.confidence_score, candidate.employee.full_name))
        return IntelligenceOutput(ranked_candidates_by_task={task.task_id: ranked[:5]})
