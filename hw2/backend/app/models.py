from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


Status = Literal["todo", "in_progress", "done"]


def clean_title(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("Title must be text")
    title = value.strip()
    if not title:
        raise ValueError("Add a title before saving")
    if len(title) > 120:
        raise ValueError("Keep the title to 120 characters or fewer")
    return title


def clean_notes(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("Notes must be text")
    notes = value.strip()
    if len(notes) > 1000:
        raise ValueError("Keep notes to 1,000 characters or fewer")
    return notes


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    notes: str = ""

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, value: object) -> str:
        return clean_title(value)

    @field_validator("notes", mode="before")
    @classmethod
    def validate_notes(cls, value: object) -> str:
        return clean_notes(value)


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    notes: str | None = None
    status: Status | None = None

    @model_validator(mode="before")
    @classmethod
    def require_changes(cls, value: object) -> object:
        if not isinstance(value, dict) or not value or any(item is None for item in value.values()):
            raise ValueError("Provide at least one non-null task change")
        return value

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, value: object) -> str:
        return clean_title(value)

    @field_validator("notes", mode="before")
    @classmethod
    def validate_notes(cls, value: object) -> str:
        return clean_notes(value)


class Task(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    notes: str
    status: Status
    createdAt: datetime
    updatedAt: datetime
