import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy import DateTime, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from .models import Task, TaskCreate, TaskUpdate


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[1] / "pocket_flow.sqlite3"


def database_url() -> str:
    return os.environ.get("POCKET_FLOW_DATABASE_URL") or f"sqlite:///{DEFAULT_DATABASE_PATH}"


class Base(DeclarativeBase):
    pass


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="todo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


def utc(value: datetime) -> datetime:
    # SQLite reads DATETIME values without timezone information.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def to_task(row: TaskRow) -> Task:
    return Task(
        id=row.id,
        title=row.title,
        notes=row.notes,
        status=row.status,
        createdAt=utc(row.created_at),
        updatedAt=utc(row.updated_at),
    )


class DatabaseTaskRepository:
    """SQLAlchemy-backed task storage; accepts a database URL for test isolation."""

    def __init__(self, url: str) -> None:
        self.engine = create_engine(url)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    def list_tasks(self) -> list[Task]:
        with self.sessions() as session:
            rows = session.scalars(
                select(TaskRow).order_by(TaskRow.created_at.desc(), TaskRow.id.desc())
            ).all()
            return [to_task(row) for row in rows]

    def create_task(self, data: TaskCreate) -> Task:
        with self.sessions.begin() as session:
            latest = session.scalar(select(func.max(TaskRow.created_at)))
            now = datetime.now(timezone.utc)
            if latest is not None:
                now = max(now, utc(latest) + timedelta(microseconds=1))
            row = TaskRow(
                id=str(uuid4()),
                title=data.title,
                notes=data.notes,
                status="todo",
                created_at=now,
                updated_at=now,
            )
            session.add(row)
            return to_task(row)

    def update_task(self, task_id: str, changes: TaskUpdate) -> Task | None:
        with self.sessions.begin() as session:
            row = session.get(TaskRow, task_id)
            if row is None:
                return None
            for field, value in changes.model_dump(exclude_unset=True).items():
                setattr(row, field, value)
            row.updated_at = max(datetime.now(timezone.utc), utc(row.updated_at) + timedelta(microseconds=1))
            return to_task(row)

    def delete_task(self, task_id: str) -> bool:
        with self.sessions.begin() as session:
            row = session.get(TaskRow, task_id)
            if row is None:
                return False
            session.delete(row)
            return True
