from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.services.json_store import JsonStore


class NotificationOpsService:
    def __init__(self, *, store: JsonStore) -> None:
        self.store = store

    def create(self, *, employee_id: str, mission_id: str | None, notification_type: str, message: str) -> dict[str, str]:
        notification = {
            "notification_id": f"notif-{uuid4().hex[:10]}",
            "employee_id": employee_id,
            "mission_id": mission_id,
            "type": notification_type,
            "message": message,
            "status": "delivered",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.store.append_to_list("notifications.json", notification)
        return {"notification_id": notification["notification_id"], "status": notification["status"]}
