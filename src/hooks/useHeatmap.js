import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useHeatmap() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        apiFetch('/api/consumption/heatmap?days=30')
            .then(raw => {
                if (!cancelled) {
                    setData(raw.map(r => ({
                        day: DAY_NAMES[r.dayOfWeek],
                        hour: r.hour,
                        value: Math.round(r.avgKwh * 100) / 100,
                    })));
                }
            })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    return { data, loading, error };
}
