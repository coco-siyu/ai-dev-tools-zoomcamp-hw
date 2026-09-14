# Pocket Flow

A personal Mini Kanban board. The [product specification](_docs/specs.md) defines the first version.

## Frontend prototype

This stage is an interactive frontend with a mocked backend. The mock stores tasks in your browser's local storage so you can try the full board flow before a real backend exists. It starts empty on a new browser profile.

You need Node.js 20 or newer. No package installation is required for this prototype.

From the `hw2` folder:

```sh
cd frontend
npm run dev
```

Open <http://127.0.0.1:5173>. Run the frontend tests with `npm test` from the same directory.

The frontend calls only `src/api/index.js`; the mock implementation is in `src/api/mockApi.js`. A future backend implementation can replace that module without changing board interactions.

The backend, OpenAPI contract, and database are later homework stages and are not part of this prototype yet.
