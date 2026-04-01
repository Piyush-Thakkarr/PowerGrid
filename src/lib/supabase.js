import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    const missing = [!supabaseUrl && 'VITE_SUPABASE_URL', !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY'].filter(Boolean).join(', ');
    console.warn(`Supabase not configured: ${missing}. Auth features disabled. Add these to .env to enable.`);
}

export const supabase = createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

// Module-level token cache — updated by onAuthStateChange, no lock needed in apiFetch
let _cachedToken = '';

supabase.auth.onAuthStateChange((_event, session) => {
    _cachedToken = session?.access_token || '';
});

// Seed the cache from the stored session (best-effort, non-blocking)
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) _cachedToken = session.access_token;
}).catch(() => {});

export const getCachedToken = () => _cachedToken;
