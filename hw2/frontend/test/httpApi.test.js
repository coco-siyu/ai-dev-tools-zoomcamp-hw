import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpApi } from '../src/api/httpApi.js';

const task = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Plan weekend hike',
  notes: 'Check the weather',
  status: 'todo',
  createdAt: '2026-09-14T12:00:00Z',
  updatedAt: '2026-09-14T12:00:00Z',
};

test('lists tasks from the backend URL', async () => {
  const calls = [];
  const api = createHttpApi('http://127.0.0.1:8000', async (...args) => {
    calls.push(args);
    return Response.json([task]);
  });
  assert.deepEqual(await api.listTasks(), [task]);
  assert.equal(calls[0][0], 'http://127.0.0.1:8000/api/tasks');
  assert.equal(calls[0][1].method, 'GET');
});

test('creates and updates tasks using JSON requests', async () => {
  const calls = [];
  const api = createHttpApi('http://127.0.0.1:8000', async (...args) => {
    calls.push(args);
    return Response.json(task, { status: calls.length === 1 ? 201 : 200 });
  });
  await api.createTask({ title: task.title, notes: task.notes });
  await api.updateTask(task.id, { status: 'done' });
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0][1].body), { title: task.title, notes: task.notes });
  assert.equal(calls[1][0], `http://127.0.0.1:8000/api/tasks/${task.id}`);
  assert.equal(calls[1][1].method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1][1].body), { status: 'done' });
});

test('deletes a task without trying to parse the 204 response', async () => {
  const api = createHttpApi('http://127.0.0.1:8000', async (_url, options) => {
    assert.equal(options.method, 'DELETE');
    return new Response(null, { status: 204 });
  });
  assert.equal(await api.deleteTask(task.id), undefined);
});

test('turns backend validation errors into a readable message', async () => {
  const api = createHttpApi('http://127.0.0.1:8000', async () => Response.json({
    detail: [{ loc: ['body', 'title'], msg: 'Value error, Add a title before saving' }],
  }, { status: 422 }));
  await assert.rejects(api.createTask({ title: '   ' }), /Add a title before saving/);
});

test('explains when the backend cannot be reached', async () => {
  const api = createHttpApi('http://127.0.0.1:8000', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(api.listTasks(), /Start the backend/);
});
