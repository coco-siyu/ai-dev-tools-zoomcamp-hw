# Pocket Flow — product specification

## Purpose

Pocket Flow is a small, personal Kanban board for keeping everyday tasks visible. A person can capture a task, see what they are working on, and move it to Done when finished. The first version is a single board for one person.

## Audience and main flow

The user is someone organizing personal tasks without needing accounts, team features, or project setup. Their main flow is:

1. Add a task to **To Do**.
2. Move it to **In Progress** when work starts.
3. Move it to **Done** when finished.
4. Return later and find the board as they left it.

## Version 1 scope

The board has three fixed columns: **To Do**, **In Progress**, and **Done**. Each task belongs to exactly one column and has:

| Field | Rule |
| --- | --- |
| Title | Required; 1–120 characters after trimming whitespace. |
| Notes | Optional; up to 1,000 characters. |
| Status | One of To Do, In Progress, or Done. New tasks start in To Do. |
| ID and timestamps | Assigned by the backend to identify and track the task. |

The user can create, edit, move, and delete tasks. On desktop, they can drag a card to another column. A visible move control must provide the same action for keyboard and touch users. Cards appear newest first within each column; manual ordering within a column is outside version 1.

The board displays the number of tasks in each column. It works on desktop and mobile; columns may stack on narrow screens. An empty column explains how to add or move a task there.

## User stories and acceptance criteria

### Add a task

As a user, I want to capture a task quickly so I do not forget it.

- I can enter a title and optional notes and save the task.
- A saved task appears once in To Do without a page reload.
- Blank or whitespace-only titles are rejected with a clear message.
- A title longer than 120 characters or notes longer than 1,000 characters are rejected.

### Review and edit tasks

As a user, I want to see all my tasks and correct their details.

- Loading the board shows every saved task in its current column.
- I can open a task and change its title or notes.
- Saving valid changes updates the card without creating a duplicate.
- Cancelling an edit leaves the task unchanged.

### Move a task

As a user, I want to show whether a task is planned, underway, or finished.

- I can move a task to any of the three columns by dragging it or using the visible move control.
- After a successful move, the card appears in exactly one column and the column counts update.
- Moving a task does not change its title or notes.

### Delete a task

As a user, I want to remove a task I no longer need.

- I can delete a task after a confirmation step.
- Cancelling the confirmation leaves the task on the board.
- A deleted task disappears from the board and does not return after refresh.

### Keep data and recover from errors

As a user, I want my board to survive a refresh and explain failed actions.

- Tasks, edits, moves, and deletions persist in a database and remain correct after restarting the app.
- If an API request fails, the interface shows a useful error and does not pretend the change was saved.
- An empty database shows an empty board, not hard-coded example tasks.

## Interface and accessibility

- Use a clear board heading, column headings, and task counts.
- Make the primary add action easy to find.
- Label form fields and buttons in plain language.
- All core actions work with a keyboard; drag and drop is never the only way to move a task.
- Show visible focus, validation, loading, and error states.
- Keep text readable and controls usable on small screens.

## Technical boundaries for this homework

- Keep the frontend and backend in separate folders. The frontend runs with Node.js; the backend uses FastAPI with `uv` for Python package management.
- Centralize frontend API calls so the initial interactive prototype can use a mock implementation before switching to the real backend.
- Define the HTTP interface in `openapi.yaml` before implementing the backend. The minimum operations are list tasks, create a task, update a task (including status), and delete a task.
- Start the backend with a mock store, then replace it with SQLite through SQLAlchemy. Keep storage behind a small interface so the API does not depend on SQLite details.
- Cover the main API behaviors and frontend interactions with tests. Include a persistence check that reloads data from a fresh database connection.
- Document setup, run commands, API URL, and test commands in `README.md` as they become real. Do not fill homework answers with guessed commands or a guessed commit hash.

## Out of scope for version 1

Accounts, multiple users or boards, sharing, comments, attachments, due dates, priorities, notifications, search, filters, and manual card ordering are deferred. The app is intended to run locally for this homework; deployment is not part of this version.

## Definition of done

From a fresh local setup, a user can start both services, create a task, edit it, move it through all three statuses, refresh and still see the correct state, then delete it. The documented test command passes, and the API behavior matches `openapi.yaml`.

## Decisions made with the user

- Project: Mini Kanban board.
- Name: Pocket Flow.
- Audience: one person tracking personal tasks.
- Card details: required title and optional notes.

This specification follows the [Homework 2 instructions](https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/blob/main/cohorts/2026/homework/02-development/homework.md); the feature scope above is the choice for this project.
