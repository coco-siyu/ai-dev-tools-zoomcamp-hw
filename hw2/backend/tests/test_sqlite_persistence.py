from fastapi.testclient import TestClient

from app.main import create_app


def test_tasks_survive_fresh_app_and_database_connection(tmp_path, monkeypatch):
    database = tmp_path / "pocket_flow.sqlite3"
    monkeypatch.setenv("POCKET_FLOW_DATABASE_URL", f"sqlite:///{database}")

    first = TestClient(create_app())
    created = first.post("/api/tasks", json={"title": "Pack for a hike", "notes": "Bring water"}).json()
    moved = first.patch(f"/api/tasks/{created['id']}", json={"status": "in_progress"}).json()

    second = TestClient(create_app())
    assert second.get("/api/tasks").json() == [moved]
    assert second.patch(f"/api/tasks/{created['id']}", json={"title": "Pack hiking bag"}).status_code == 200

    third = TestClient(create_app())
    saved = third.get("/api/tasks").json()
    assert len(saved) == 1
    assert saved[0]["title"] == "Pack hiking bag"
    assert saved[0]["status"] == "in_progress"
    assert saved[0]["createdAt"] == created["createdAt"]

    assert third.delete(f"/api/tasks/{created['id']}").status_code == 204
    assert TestClient(create_app()).get("/api/tasks").json() == []
