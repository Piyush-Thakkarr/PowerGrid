import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useConsumptionData() {
    const [stats, setStats] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [statsRes, monthlyRes] = await Promise.all([
                    apiFetch('/api/consumption/stats'),
                    apiFetch('/api/consumption/monthly?months=6'),
                ]);
                if (!cancelled) {
                    setStats(statsRes);
                    setMonthly(monthlyRes);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { stats, monthly, loading, error };
}
