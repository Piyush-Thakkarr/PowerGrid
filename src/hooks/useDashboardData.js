import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

/**
 * Single API call to fetch all dashboard data at once.
 * Avoids 6+ separate cold-start requests on serverless.
 */
export function useDashboardData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const res = await apiFetch('/api/dashboard');
                if (!cancelled) setData(res);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { data, loading, error };
}
