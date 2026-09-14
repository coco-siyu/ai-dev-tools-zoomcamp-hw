# Pocket Flow

A personal Mini Kanban board. The [product specification](_docs/specs.md) defines the first version.

## Run Pocket Flow

The frontend sends task requests to the FastAPI backend. Start the backend first, then the frontend in a second terminal. The backend stores tasks in `backend/pocket_flow.sqlite3`, creating that file automatically. Tasks remain after the backend restarts. Tasks from the earlier in-memory backend or browser local-storage prototype are not migrated.

You need Node.js 20 or newer and `uv`.

From the `hw2` folder:

```sh
cd backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal, from `hw2`:

```sh
cd frontend
npm run dev
```

Open <http://127.0.0.1:5173>. The frontend calls <http://127.0.0.1:8000/api/tasks>; FastAPI's interactive documentation is at <http://127.0.0.1:8000/docs>. The API follows [openapi.yaml](openapi.yaml).

To use another database URL, set `POCKET_FLOW_DATABASE_URL` before starting the backend. For example, `POCKET_FLOW_DATABASE_URL=sqlite:////tmp/pocket-flow.sqlite3 uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`. The default SQLite file is ignored by Git.

Run tests from each directory:

```sh
cd frontend
npm test
```

```sh
cd backend
uv run pytest
```
