from __future__ import annotations

from uuid import uuid4

from app.core.errors import MissionEngineError
from app.services.json_store import JsonStore


class CalendarOpsService:
    def __init__(self, *, store: JsonStore) -> None:
        self.store = store

    def check(self, *, employee_ids: list[str], date: str, employee_index: dict[str, dict]) -> list[dict]:
        calendar_entries = self.store.read("calendar.json")
        date_key = self._date_key(date)
        results: list[dict] = []
        for entry in calendar_entries:
            if employee_ids and entry["employee_id"] not in employee_ids:
                continue
            employee = employee_index[entry["employee_id"]]
            day = entry[date_key]
            results.append({
                "employee_id": entry["employee_id"],
                "availability": employee["availability"],
                "workload": employee["current_workload"],
                "preferred_meeting_hours": entry["preferred_meeting_hours"],
                "slots": day["slots"],
            })
        return results

    def schedule(self, *, employee_ids: list[str], date: str, start: str, end: str, title: str) -> dict[str, object]:
        calendar_entries = self.store.read("calendar.json")
        date_key = self._date_key(date)
        scheduled: list[str] = []
        conflicted: list[str] = []
        for entry in calendar_entries:
            if entry["employee_id"] not in employee_ids:
                continue
            slot = next((slot for slot in entry[date_key]["slots"] if slot["start"] == start and slot["end"] == end), None)
            if slot is None or slot["status"] == "busy":
                conflicted.append(entry["employee_id"])
                continue
            slot["status"] = "busy"
            slot["meeting_title"] = title
            scheduled.append(entry["employee_id"])
        if not scheduled:
            raise MissionEngineError("Unable to schedule meeting because all requested employees have conflicts.")
        self.store.write("calendar.json", calendar_entries)
        return {
            "meeting_id": f"meeting-{uuid4().hex[:10]}",
            "scheduled_employee_ids": scheduled,
            "conflicted_employee_ids": conflicted,
            "date": date,
            "start": start,
            "end": end,
            "title": title,
        }

    @staticmethod
    def _date_key(date: str) -> str:
        if date == "2026-07-01":
            return "today"
        if date == "2026-07-02":
            return "tomorrow"
        raise MissionEngineError(f"Unsupported calendar date: {date}")
