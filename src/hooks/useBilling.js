import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useBilling() {
    const [bill, setBill] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        Promise.all([
            apiFetch(`/api/billing/calculate?month=${month}&year=${year}`),
            apiFetch('/api/billing/history?months=6'),
        ])
            .then(([billRes, historyRes]) => {
                if (!cancelled) {
                    setBill(billRes);
                    setHistory(historyRes);
                }
            })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    return { bill, history, loading, error };
}
