import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockApi } from '../src/api/mockApi.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('creates a task in To Do and keeps it across API instances', async () => {
  const storage = memoryStorage();
  const first = createMockApi(storage, () => 'task-1');
  const created = await first.createTask({ title: '  Plan hike  ', notes: '  Check the weather  ' });
  assert.equal(created.title, 'Plan hike');
  assert.equal(created.notes, 'Check the weather');
  assert.equal(created.status, 'todo');
  const second = createMockApi(storage);
  assert.deepEqual(await second.listTasks(), [created]);
});

test('edits and moves a task without duplicating it', async () => {
  const api = createMockApi(memoryStorage(), () => 'task-1');
  await api.createTask({ title: 'Plan hike' });
  const updated = await api.updateTask('task-1', { title: 'Plan a hike', notes: 'Bring water', status: 'in_progress' });
  assert.equal(updated.title, 'Plan a hike');
  assert.equal(updated.notes, 'Bring water');
  assert.equal(updated.status, 'in_progress');
  assert.equal((await api.listTasks()).length, 1);
});

test('rejects invalid task details and status without changing saved data', async () => {
  const api = createMockApi(memoryStorage(), () => 'task-1');
  await assert.rejects(api.createTask({ title: '   ' }), /Add a title/);
  await assert.rejects(api.createTask({ title: 'x'.repeat(121) }), /120 characters/);
  await assert.rejects(api.createTask({ title: 'Valid', notes: 'x'.repeat(1001) }), /1,000 characters/);
  await api.createTask({ title: 'Valid' });
  await assert.rejects(api.updateTask('task-1', { status: 'lost' }), /valid column/);
  assert.equal((await api.listTasks())[0].status, 'todo');
});

test('deletes only the requested task', async () => {
  const ids = ['task-1', 'task-2'];
  const api = createMockApi(memoryStorage(), () => ids.shift());
  await api.createTask({ title: 'One' });
  await api.createTask({ title: 'Two' });
  await api.deleteTask('task-1');
  assert.deepEqual((await api.listTasks()).map((task) => task.title), ['Two']);
  await assert.rejects(api.deleteTask('task-1'), /no longer exists/);
});

test('lists the newest task first even when tasks are created in one clock tick', async () => {
  const ids = ['task-1', 'task-2'];
  const api = createMockApi(memoryStorage(), () => ids.shift());
  await api.createTask({ title: 'First' });
  await api.createTask({ title: 'Second' });
  assert.deepEqual((await api.listTasks()).map((task) => task.title), ['Second', 'First']);
});
