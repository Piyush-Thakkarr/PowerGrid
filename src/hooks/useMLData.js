import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function useMLEndpoint(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        apiFetch(path)
            .then(res => { if (!cancelled) setData(res); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [path]);

    return { data, loading, error };
}

export function useMLForecast() {
    return useMLEndpoint('/api/ml/forecast/compare?horizon=7');
}

export function useMLAnomalies() {
    return useMLEndpoint('/api/ml/anomalies?sensitivity=0.05');
}

export function useMLDecomposition() {
    return useMLEndpoint('/api/ml/decomposition');
}

export function useMLPeakHours() {
    return useMLEndpoint('/api/ml/peak-hours?days=30');
}

export function useMLRecommendations() {
    return useMLEndpoint('/api/ml/recommendations');
}
