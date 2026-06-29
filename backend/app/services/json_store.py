from __future__ import annotations

import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock
from typing import Any

from app.core.errors import JsonStoreError


class JsonStore:
    """Secure JSON access layer for local knowledge files."""

    allowed_files = frozenset(
        {
            "employees.json",
            "projects.json",
            "missions.json",
            "calendar.json",
            "skills.json",
            "departments.json",
            "notifications.json",
        }
    )

    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path.resolve()
        self._lock = Lock()
        self._cache: dict[str, tuple[int, int, Any]] = {}

    def _resolve(self, name: str) -> Path:
        if name not in self.allowed_files:
            raise JsonStoreError(f"Access to JSON file '{name}' is not allowed.")
        path = (self.base_path / name).resolve()
        if path.parent != self.base_path:
            raise JsonStoreError("Resolved JSON path escapes the data directory.")
        return path

    def read(self, name: str) -> Any:
        path = self._resolve(name)
        try:
            stat = path.stat()
            cached = self._cache.get(name)
            if cached and cached[0] == stat.st_mtime_ns and cached[1] == stat.st_size:
                return cached[2]
            with path.open("r", encoding="utf-8") as file_obj:
                payload = json.load(file_obj)
            self._cache[name] = (stat.st_mtime_ns, stat.st_size, payload)
            return payload
        except FileNotFoundError as exc:
            raise JsonStoreError(f"Required JSON file '{name}' was not found.") from exc
        except json.JSONDecodeError as exc:
            raise JsonStoreError(f"JSON file '{name}' is malformed.") from exc
        except OSError as exc:
            raise JsonStoreError(f"Unable to read JSON file '{name}'.") from exc

    def write(self, name: str, payload: Any) -> None:
        path = self._resolve(name)
        try:
            with self._lock:
                with NamedTemporaryFile("w", delete=False, dir=str(self.base_path), encoding="utf-8") as temp_file:
                    json.dump(payload, temp_file, indent=2)
                    temp_path = Path(temp_file.name)
                temp_path.replace(path)
                stat = path.stat()
                self._cache[name] = (stat.st_mtime_ns, stat.st_size, payload)
        except OSError as exc:
            raise JsonStoreError(f"Unable to write JSON file '{name}'.") from exc

    def append_to_list(self, name: str, item: dict[str, Any]) -> list[dict[str, Any]]:
        payload = self.read(name)
        if not isinstance(payload, list):
            raise JsonStoreError(f"JSON file '{name}' must contain a list.")
        payload.append(item)
        self.write(name, payload)
        return payload

    def fingerprint(self) -> dict[str, tuple[int, int]]:
        result: dict[str, tuple[int, int]] = {}
        for name in self.allowed_files:
            path = self._resolve(name)
            stat = path.stat()
            result[name] = (stat.st_mtime_ns, stat.st_size)
        return result
