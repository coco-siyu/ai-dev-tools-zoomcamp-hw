from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.store import MemoryTaskRepository


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("POCKET_FLOW_DATABASE_URL", f"sqlite:///{tmp_path / 'tasks.sqlite3'}")
    return TestClient(create_app())


def add_task(client, title="Plan weekend hike", notes="Check the weather"):
    return client.post("/api/tasks", json={"title": title, "notes": notes})


def test_list_starts_empty(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert response.json() == []


def test_create_returns_task_in_todo_and_lists_newest_first(client):
    first = add_task(client, title="  Plan weekend hike  ", notes="  Check the weather  ")
    assert first.status_code == 201
    task = first.json()
    assert set(task) == {"id", "title", "notes", "status", "createdAt", "updatedAt"}
    assert task["title"] == "Plan weekend hike"
    assert task["notes"] == "Check the weather"
    assert task["status"] == "todo"
    assert datetime.fromisoformat(task["createdAt"])
    assert datetime.fromisoformat(task["updatedAt"])

    second = add_task(client, title="Book dentist", notes="")
    assert second.status_code == 201
    assert [item["title"] for item in client.get("/api/tasks").json()] == [
        "Book dentist",
        "Plan weekend hike",
    ]


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "   "},
        {"title": "x" * 121},
        {"title": "Valid", "notes": "x" * 1001},
        {"title": "Valid", "status": "done"},
    ],
)
def test_create_rejects_invalid_data_without_saving(client, payload):
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 422
    assert client.get("/api/tasks").json() == []


def test_patch_edits_and_moves_without_duplicate(client):
    original = add_task(client).json()
    response = client.patch(
        f"/api/tasks/{original['id']}",
        json={"title": "  Plan a hike  ", "notes": "Bring water", "status": "in_progress"},
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == original["id"]
    assert updated["createdAt"] == original["createdAt"]
    assert updated["title"] == "Plan a hike"
    assert updated["notes"] == "Bring water"
    assert updated["status"] == "in_progress"
    assert client.get("/api/tasks").json() == [updated]


def test_status_only_patch_preserves_title_and_notes(client):
    original = add_task(client).json()
    response = client.patch(f"/api/tasks/{original['id']}", json={"status": "done"})
    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "done"
    assert updated["title"] == original["title"]
    assert updated["notes"] == original["notes"]
    assert updated["createdAt"] == original["createdAt"]


def test_notes_are_optional_on_create(client):
    response = client.post("/api/tasks", json={"title": "Book dentist"})
    assert response.status_code == 201
    assert response.json()["notes"] == ""


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"title": "   "},
        {"status": "blocked"},
        {"notes": "x" * 1001},
        {"unknown": "field"},
    ],
)
def test_patch_rejects_invalid_data_without_changing_task(client, payload):
    original = add_task(client).json()
    response = client.patch(f"/api/tasks/{original['id']}", json=payload)
    assert response.status_code == 422
    assert client.get("/api/tasks").json() == [original]


def test_missing_task_returns_404_for_patch_and_delete(client):
    missing = "00000000-0000-0000-0000-000000000000"
    assert client.patch(f"/api/tasks/{missing}", json={"status": "done"}).status_code == 404
    assert client.delete(f"/api/tasks/{missing}").status_code == 404


def test_delete_returns_no_content_and_removes_task(client):
    task = add_task(client).json()
    response = client.delete(f"/api/tasks/{task['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/api/tasks").json() == []


def test_mock_repositories_are_isolated():
    first = TestClient(create_app(MemoryTaskRepository()))
    second = TestClient(create_app(MemoryTaskRepository()))
    assert add_task(first).status_code == 201
    assert second.get("/api/tasks").json() == []


@pytest.mark.parametrize("origin", ["http://127.0.0.1:5173", "http://localhost:5173"])
def test_frontend_origin_can_preflight_json_updates(client, origin):
    response = client.options(
        "/api/tasks/11111111-1111-1111-1111-111111111111",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "PATCH" in response.headers["access-control-allow-methods"]
