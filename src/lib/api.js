export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
    let token = '';
    try {
        token = (await window.Clerk?.session?.getToken?.()) || '';
    } catch { /* proceed without token */ }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json.detail || json.error || `Request failed (${res.status})`);
    }
    return json;
}
