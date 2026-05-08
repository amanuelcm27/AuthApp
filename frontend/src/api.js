const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

let currentAccessToken = null;

export function setAccessToken(accessToken) {
  currentAccessToken = accessToken;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
        ...(options.headers ?? {})
      },
      ...options
    });
  } catch {
    throw new Error(`Cannot reach API at ${API_BASE_URL}`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed (${response.status})`);
  }

  return payload;
}

export const api = {
  register: body => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: body => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  adminHealth: () => request('/auth/admin/health'),
  adminUsers: () => request('/auth/admin/users'),
  deleteUser: userId => request(`/auth/admin/users/${userId}`, { method: 'DELETE' }),
  listTodos: () => request('/auth/todos'),
  createTodo: body => request('/auth/todos', { method: 'POST', body: JSON.stringify(body) }),
  updateTodo: (todoId, body) => request(`/auth/todos/${todoId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTodo: todoId => request(`/auth/todos/${todoId}`, { method: 'DELETE' })
};

export const apiBaseUrl = API_BASE_URL;
