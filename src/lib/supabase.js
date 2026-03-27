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
            lock: false,
        },
    }
);
