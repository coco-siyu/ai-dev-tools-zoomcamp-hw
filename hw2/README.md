# Pocket Flow

A personal Mini Kanban board. The [product specification](_docs/specs.md) defines the first version.

## Frontend prototype

The interactive frontend currently uses a mock API that stores tasks in your browser's local storage. It starts empty on a new browser profile. The frontend has not been connected to the FastAPI backend yet.

You need Node.js 20 or newer. No package installation is required for this prototype.

From the `hw2` folder:

```sh
cd frontend
npm run dev
```

Open <http://127.0.0.1:5173>. Run the frontend tests with `npm test` from the same directory.

The frontend calls only `src/api/index.js`; the mock implementation is in `src/api/mockApi.js`. The next stage will switch that adapter to the real HTTP API.

## FastAPI backend with a mock store

The backend follows [openapi.yaml](openapi.yaml). It holds tasks in memory, so backend data resets when the process stops. SQLite persistence comes in a later stage.

From a second terminal in the `hw2` folder:

```sh
cd backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is at <http://127.0.0.1:8000/api/tasks>; FastAPI's interactive documentation is at <http://127.0.0.1:8000/docs>. Run endpoint tests from `backend/` with:

```sh
uv run pytest
```
