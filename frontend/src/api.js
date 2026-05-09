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
  adminUpdateUser: (userId, body) => request(`/auth/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateProfile: body => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadAvatar: async file => {
    const form = new FormData();
    form.append('avatar', file);
    const url = `${apiBaseUrl}/auth/me/avatar`;

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {})
        },
        body: form
      });
    } catch (err) {
      console.error('Upload network error', { url, err });
      throw new Error(`Network error while uploading avatar to ${url}`);
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Upload failed', { url, status: res.status, payload });
      throw new Error(payload.message ?? `Upload failed (${res.status})`);
    }

    return payload;
  },
  // Todo endpoints
  listTodos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return request(`/api/todos${queryString ? '?' + queryString : ''}`);
  },
  getTodoStats: () => request('/api/todos/stats'),
  createTodo: body => request('/api/todos', { method: 'POST', body: JSON.stringify(body) }),
  getTodo: todoId => request(`/api/todos/${todoId}`),
  updateTodo: (todoId, body) => request(`/api/todos/${todoId}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleTodo: todoId => request(`/api/todos/${todoId}/toggle`, { method: 'PATCH' }),
  deleteTodo: todoId => request(`/api/todos/${todoId}`, { method: 'DELETE' }),
  clearCompletedTodos: () => request('/api/todos/completed/all', { method: 'DELETE' }),
  // 2FA endpoints
  setup2FA: () => request('/auth/2fa/setup'),
  verify2FASetup: body => request('/auth/2fa/verify-setup', { method: 'POST', body: JSON.stringify(body) }),
  disable2FA: () => request('/auth/2fa/disable', { method: 'POST' }),
  verify2FALogin: body => request('/auth/2fa/verify-login', { method: 'POST', body: JSON.stringify(body) })
};

export const apiBaseUrl = API_BASE_URL;
