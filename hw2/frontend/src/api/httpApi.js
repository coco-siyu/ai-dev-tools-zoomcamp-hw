export const API_BASE_URL = 'http://127.0.0.1:8000';

function errorMessage(payload, status) {
  const detail = payload?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return String(detail[0].msg || 'The task could not be saved.').replace(/^Value error,\s*/, '');
  }
  return `Request failed (HTTP ${status}). Try again.`;
}

export function createHttpApi(baseUrl = API_BASE_URL, fetchImpl = globalThis.fetch) {
  const root = baseUrl.replace(/\/+$/, '');

  async function request(path, method, body) {
    const options = { method, headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetchImpl(`${root}${path}`, options);
    } catch {
      throw new Error(`Could not reach the API at ${root}. Start the backend and try again.`);
    }

    if (response.status === 204) return undefined;

    let payload;
    try {
      payload = await response.json();
    } catch {
      if (!response.ok) throw new Error(`Request failed (HTTP ${response.status}). Try again.`);
      throw new Error('The backend returned an unreadable response. Try again.');
    }

    if (!response.ok) throw new Error(errorMessage(payload, response.status));
    return payload;
  }

  return {
    listTasks: () => request('/api/tasks', 'GET'),
    createTask: (input) => request('/api/tasks', 'POST', input),
    updateTask: (id, changes) => request(`/api/tasks/${encodeURIComponent(id)}`, 'PATCH', changes),
    deleteTask: (id) => request(`/api/tasks/${encodeURIComponent(id)}`, 'DELETE'),
  };
}
