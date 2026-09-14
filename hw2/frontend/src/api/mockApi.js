import { STATUSES } from '../statuses.js';

const STORAGE_KEY = 'pocket-flow.tasks.v1';

function copy(task) {
  return { ...task };
}

export function createMockApi(storage = globalThis.localStorage, makeId = () => globalThis.crypto.randomUUID()) {
  function read() {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const tasks = JSON.parse(raw);
      if (!Array.isArray(tasks)) throw new Error('Invalid board data');
      return tasks;
    } catch {
      throw new Error('The saved board could not be read. Check your browser storage.');
    }
  }

  function write(tasks) {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function validateTitle(value) {
    const title = String(value ?? '').trim();
    if (!title) throw new Error('Add a title before saving.');
    if (title.length > 120) throw new Error('Keep the title to 120 characters or fewer.');
    return title;
  }

  function validateNotes(value) {
    const notes = String(value ?? '').trim();
    if (notes.length > 1000) throw new Error('Keep notes to 1,000 characters or fewer.');
    return notes;
  }

  return {
    async listTasks() {
      return read().map(copy).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async createTask(input) {
      const tasks = read();
      const latestCreatedAt = tasks.reduce((latest, task) => Math.max(latest, Date.parse(task.createdAt) || 0), 0);
      const now = new Date(Math.max(Date.now(), latestCreatedAt + 1)).toISOString();
      const task = {
        id: makeId(),
        title: validateTitle(input.title),
        notes: validateNotes(input.notes),
        status: 'todo',
        createdAt: now,
        updatedAt: now,
      };
      write([...tasks, task]);
      return copy(task);
    },

    async updateTask(id, changes) {
      const tasks = read();
      const index = tasks.findIndex((task) => task.id === id);
      if (index < 0) throw new Error('This task no longer exists. Refresh the board.');
      const task = tasks[index];
      const next = {
        ...task,
        title: Object.hasOwn(changes, 'title') ? validateTitle(changes.title) : task.title,
        notes: Object.hasOwn(changes, 'notes') ? validateNotes(changes.notes) : task.notes,
        status: Object.hasOwn(changes, 'status') ? changes.status : task.status,
        updatedAt: new Date().toISOString(),
      };
      if (!STATUSES.includes(next.status)) throw new Error('Choose a valid column.');
      tasks[index] = next;
      write(tasks);
      return copy(next);
    },

    async deleteTask(id) {
      const tasks = read();
      const remaining = tasks.filter((task) => task.id !== id);
      if (remaining.length === tasks.length) throw new Error('This task no longer exists. Refresh the board.');
      write(remaining);
    },
  };
}
