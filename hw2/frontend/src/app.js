import { taskApi } from './api/index.js';
import { STATUSES } from './statuses.js';

const statusNames = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const listIds = { todo: 'todo-list', in_progress: 'in-progress-list', done: 'done-list' };
const countIds = { todo: 'todo-count', in_progress: 'in-progress-count', done: 'done-count' };
const emptyCopy = {
  todo: ['Your page is clear', 'Add a task to give this space a start.'],
  in_progress: ['Nothing underway', 'Move a task here when you begin.'],
  done: ['A fresh finish line', 'Completed tasks will land here.'],
};

const board = document.querySelector('#board');
const notice = document.querySelector('#notice');
const dialog = document.querySelector('#task-dialog');
const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const notesInput = document.querySelector('#task-notes');
const formError = document.querySelector('#form-error');
const confirmPanel = document.querySelector('#delete-confirm');
const dialogActions = document.querySelector('#dialog-actions');
const deleteTrigger = document.querySelector('#delete-trigger');
const saveButton = document.querySelector('#save-task');
let tasks = [];
let editingId = null;

function showNotice(message, kind = 'info') {
  notice.textContent = message;
  notice.dataset.kind = kind;
  notice.hidden = false;
}

function clearNotice() {
  notice.hidden = true;
  notice.textContent = '';
}

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearFormError() {
  formError.hidden = true;
  formError.textContent = '';
}

function makeEmptyState(status) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  const symbol = document.createElement('span');
  symbol.className = 'empty-symbol';
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = '✦';
  const heading = document.createElement('strong');
  heading.textContent = emptyCopy[status][0];
  const detail = document.createElement('p');
  detail.textContent = emptyCopy[status][1];
  empty.append(symbol, heading, detail);
  return empty;
}

function makeCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.id = task.id;

  const open = document.createElement('button');
  open.className = 'task-open';
  open.type = 'button';
  open.draggable = true;
  open.setAttribute('aria-label', `Edit ${task.title}`);
  const title = document.createElement('strong');
  title.className = 'task-title';
  title.textContent = task.title;
  open.append(title);
  if (task.notes) {
    const notes = document.createElement('span');
    notes.className = 'task-notes';
    notes.textContent = task.notes;
    open.append(notes);
  }
  open.addEventListener('click', () => openTaskDialog(task));

  const moveRow = document.createElement('div');
  moveRow.className = 'move-row';
  const label = document.createElement('label');
  label.textContent = 'Move to';
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Move ${task.title} to`);
  for (const status of STATUSES) {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = statusNames[status];
    option.selected = task.status === status;
    select.append(option);
  }
  select.addEventListener('change', () => moveTask(task.id, select.value));
  label.append(select);
  moveRow.append(label);

  card.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
  card.append(open, moveRow);
  return card;
}

function render() {
  for (const status of STATUSES) {
    const list = document.getElementById(listIds[status]);
    const count = document.getElementById(countIds[status]);
    const matching = tasks.filter((task) => task.status === status);
    count.textContent = String(matching.length);
    count.setAttribute('aria-label', `${matching.length} ${matching.length === 1 ? 'task' : 'tasks'}`);
    list.replaceChildren(...(matching.length ? matching.map(makeCard) : [makeEmptyState(status)]));
  }
}

async function refresh() {
  board.setAttribute('aria-busy', 'true');
  try {
    tasks = await taskApi.listTasks();
    render();
  } catch (error) {
    showNotice(error.message || 'Could not load tasks. Refresh the page to try again.', 'error');
  } finally {
    board.removeAttribute('aria-busy');
  }
}

function openTaskDialog(task = null) {
  editingId = task?.id ?? null;
  form.reset();
  clearFormError();
  confirmPanel.hidden = true;
  dialogActions.hidden = false;
  titleInput.value = task?.title ?? '';
  notesInput.value = task?.notes ?? '';
  document.querySelector('#dialog-heading').textContent = task ? 'Edit task' : 'Add a task';
  saveButton.textContent = task ? 'Save changes' : 'Add task';
  deleteTrigger.hidden = !task;
  dialog.showModal();
  titleInput.focus();
}

async function moveTask(id, status) {
  clearNotice();
  const task = tasks.find((item) => item.id === id);
  if (!task || task.status === status) return;
  try {
    const updated = await taskApi.updateTask(id, { status });
    tasks = tasks.map((item) => item.id === id ? updated : item);
    render();
    showNotice(`Moved “${task.title}” to ${statusNames[status]}.`);
  } catch (error) {
    render();
    showNotice(error.message || 'Could not move the task. Try again.', 'error');
  }
}

document.querySelector('#add-task').addEventListener('click', () => openTaskDialog());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  confirmPanel.hidden = true;
  dialogActions.hidden = false;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormError();
  const input = { title: titleInput.value, notes: notesInput.value };
  saveButton.disabled = true;
  try {
    if (editingId) {
      const updated = await taskApi.updateTask(editingId, input);
      tasks = tasks.map((item) => item.id === editingId ? updated : item);
    } else {
      const created = await taskApi.createTask(input);
      tasks = [created, ...tasks];
    }
    render();
    dialog.close();
    showNotice(editingId ? 'Task updated.' : 'Task added.');
  } catch (error) {
    showFormError(error.message || 'Could not save the task. Try again.');
  } finally {
    saveButton.disabled = false;
  }
});

deleteTrigger.addEventListener('click', () => {
  confirmPanel.hidden = false;
  dialogActions.hidden = true;
  document.querySelector('#cancel-delete').focus();
});
document.querySelector('#cancel-delete').addEventListener('click', () => {
  confirmPanel.hidden = true;
  dialogActions.hidden = false;
  deleteTrigger.focus();
});
document.querySelector('#confirm-delete').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await taskApi.deleteTask(editingId);
    tasks = tasks.filter((task) => task.id !== editingId);
    render();
    dialog.close();
    showNotice('Task deleted.');
  } catch (error) {
    showFormError(error.message || 'Could not delete the task. Try again.');
  } finally {
    button.disabled = false;
  }
});

for (const lane of document.querySelectorAll('.lane')) {
  lane.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    lane.classList.add('is-drop-target');
  });
  lane.addEventListener('dragleave', (event) => {
    if (!lane.contains(event.relatedTarget)) lane.classList.remove('is-drop-target');
  });
  lane.addEventListener('drop', (event) => {
    event.preventDefault();
    lane.classList.remove('is-drop-target');
    const id = event.dataTransfer.getData('text/plain');
    if (id) moveTask(id, lane.dataset.status);
  });
}

refresh();
