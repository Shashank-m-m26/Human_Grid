from __future__ import annotations

from collections import Counter, defaultdict

from app.core.errors import KnowledgeLayerError
from app.services.knowledge_layer import KnowledgeLayerService


class AnalyticsService:
    def __init__(self, *, knowledge_layer: KnowledgeLayerService) -> None:
        self.knowledge_layer = knowledge_layer

    def workload_summary(self) -> list[dict[str, object]]:
        graph = self.knowledge_layer.load_graph()
        grouped: dict[str, list[int]] = defaultdict(list)
        for employee in graph.employees:
            grouped[employee.department].append(employee.current_workload)
        return [
            {
                "department_name": department,
                "employee_count": len(workloads),
                "average_workload": round(sum(workloads) / len(workloads), 2),
            }
            for department, workloads in sorted(grouped.items())
        ]

    def skill_distribution(self) -> list[dict[str, object]]:
        graph = self.knowledge_layer.load_graph()
        counts = Counter(skill for employee in graph.employees for skill in employee.skills)
        category_lookup = {skill.skill_name: skill.category for skill in graph.skills}
        return [
            {
                "skill_name": skill_name,
                "employee_count": count,
                "category": category_lookup.get(skill_name, "Unknown"),
            }
            for skill_name, count in counts.most_common()
        ]

    def team_balance(self, *, employee_ids: list[str]) -> dict[str, object]:
        if not employee_ids:
            raise KnowledgeLayerError("Team balance requires at least one employee id.")
        employees = [self.knowledge_layer.resolve_employee(employee_id) for employee_id in employee_ids]
        department_distribution = Counter(employee.department for employee in employees)
        avg_experience = round(sum(employee.experience_years for employee in employees) / len(employees), 2)
        avg_workload = round(sum(employee.current_workload for employee in employees) / len(employees), 2)
        avg_collaboration = round(sum(employee.collaboration_score for employee in employees) / len(employees), 2)
        diversity_score = round((len(department_distribution) / len(employees)) * 100, 2)
        return {
            "department_distribution": dict(department_distribution),
            "average_experience_years": avg_experience,
            "average_workload": avg_workload,
            "average_collaboration_score": avg_collaboration,
            "diversity_score": diversity_score,
        }
