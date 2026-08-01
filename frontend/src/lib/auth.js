const API_URL = import.meta.env.VITE_API_URL || '/api/user';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete the request.');
  return payload;
}

export function registerUser(details) {
  return request('/register', { method: 'POST', body: JSON.stringify(details) });
}

export function loginUser(credentials) {
  return request('/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export function logoutUser() {
  return request('/logout', { method: 'POST' });
}
