from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .models import Task, TaskCreate, TaskUpdate
from .store import MemoryTaskRepository, TaskRepository


def create_app(repository: TaskRepository | None = None) -> FastAPI:
    store = repository if repository is not None else MemoryTaskRepository()
    app = FastAPI(title="Pocket Flow API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )
    app.state.task_repository = store

    @app.get("/api/tasks", response_model=list[Task], operation_id="listTasks")
    def list_tasks() -> list[Task]:
        return store.list_tasks()

    @app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED, operation_id="createTask")
    def create_task(data: TaskCreate) -> Task:
        return store.create_task(data)

    @app.patch("/api/tasks/{task_id}", response_model=Task, operation_id="updateTask")
    def update_task(task_id: str, changes: TaskUpdate) -> Task:
        task = store.update_task(task_id, changes)
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteTask")
    def delete_task(task_id: str) -> None:
        if not store.delete_task(task_id):
            raise HTTPException(status_code=404, detail="Task not found")

    return app


app = create_app()
