# Pocket Flow agent guide

## Project map

- Read `_docs/specs.md` for product behavior and `openapi.yaml` for the API contract.
- `frontend/` contains the Kanban interface. Keep HTTP calls in `frontend/src/api/` rather than adding them to board components.
- `backend/` contains the FastAPI app. Keep task storage behind the `TaskRepository` interface in `backend/app/store.py`; the default implementation uses SQLAlchemy and SQLite.

## Working agreements

- Preserve the three task statuses and the request and response shapes in `openapi.yaml` when changing behavior. Update the contract and relevant tests if an API change is intentional.
- Run `npm test` from `frontend/` after changing frontend code.
- Use `uv` for backend dependencies and run `uv run pytest` from `backend/` after changing backend code.
- Update `README.md` when setup steps, run commands, or configuration change.
- Do not commit local database files, virtual environments, or secrets.
