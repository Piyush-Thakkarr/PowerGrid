import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

/**
 * Generic data hook — calls apiFetch(path), tracks loading/error,
 * cancels on unmount, refetches when path changes.
 */
export function useApi(path, { skip = false } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (skip || !path) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        apiFetch(path)
            .then(res => { if (!cancelled) setData(res); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [path, skip]);

    return { data, loading, error };
}
