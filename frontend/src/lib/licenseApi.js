const API_URL = '/api/licenses';

async function request(path = '', options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'API request failed');
  return response.json();
}

// The frontend remains usable when the optional Express/Mongo development API
// is not running. Successful calls return true; unavailable calls return false.
export async function loadPersistedLicenses() {
  try {
    const payload = await request();
    return payload.licenses;
  } catch {
    return null;
  }
}

export async function createPersistedLicense(license) {
  try {
    await request('', { method: 'POST', body: JSON.stringify(license) });
    return true;
  } catch {
    return false;
  }
}

export async function updatePersistedLicense(licenseNumber, update) {
  try {
    await request(`/${encodeURIComponent(licenseNumber)}`, { method: 'PATCH', body: JSON.stringify(update) });
    return true;
  } catch {
    return false;
  }
}
