from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Protocol
from uuid import uuid4

from .models import Task, TaskCreate, TaskUpdate


class TaskRepository(Protocol):
    def list_tasks(self) -> list[Task]: ...

    def create_task(self, data: TaskCreate) -> Task: ...

    def update_task(self, task_id: str, changes: TaskUpdate) -> Task | None: ...

    def delete_task(self, task_id: str) -> bool: ...


class MemoryTaskRepository:
    """Process-local store for the mock-backend stage."""

    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}
        self._lock = Lock()

    def list_tasks(self) -> list[Task]:
        with self._lock:
            ordered = sorted(self._tasks.values(), key=lambda task: task.createdAt, reverse=True)
            return [task.model_copy(deep=True) for task in ordered]

    def create_task(self, data: TaskCreate) -> Task:
        with self._lock:
            now = datetime.now(timezone.utc)
            if self._tasks:
                latest = max(task.createdAt for task in self._tasks.values())
                now = max(now, latest + timedelta(microseconds=1))
            task = Task(
                id=uuid4(),
                title=data.title,
                notes=data.notes,
                status="todo",
                createdAt=now,
                updatedAt=now,
            )
            self._tasks[str(task.id)] = task
            return task.model_copy(deep=True)

    def update_task(self, task_id: str, changes: TaskUpdate) -> Task | None:
        with self._lock:
            current = self._tasks.get(task_id)
            if current is None:
                return None
            updated_at = max(datetime.now(timezone.utc), current.updatedAt + timedelta(microseconds=1))
            updated = current.model_copy(update={
                **changes.model_dump(exclude_unset=True),
                "updatedAt": updated_at,
            })
            self._tasks[task_id] = updated
            return updated.model_copy(deep=True)

    def delete_task(self, task_id: str) -> bool:
        with self._lock:
            return self._tasks.pop(task_id, None) is not None
