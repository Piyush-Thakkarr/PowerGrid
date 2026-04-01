import { supabase } from './supabase';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
    let token = '';
    try {
        const timeout = new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 3000));
        const { data: { session } } = await Promise.race([supabase.auth.getSession(), timeout]);
        token = session?.access_token || '';
    } catch { /* proceed without token */ }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || json.detail || `Request failed (${res.status})`);
    }

    return json;
}
