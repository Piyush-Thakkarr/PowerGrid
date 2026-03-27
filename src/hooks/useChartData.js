import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function mapHourly(raw) {
    return raw.map(r => ({
        time: new Date(r.hour).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        units: Math.round(r.kwh * 100) / 100,
    }));
}

function mapDaily(raw) {
    return raw.map(r => ({
        day: DAY_NAMES[new Date(r.date).getDay()],
        date: r.date,
        units: Math.round(r.kwh * 100) / 100,
    }));
}

function mapMonthly(raw) {
    return raw.map(r => ({
        month: MONTH_NAMES[parseInt(r.month.split('-')[1]) - 1],
        units: Math.round(r.kwh * 100) / 100,
    }));
}

const VIEW_CONFIG = {
    hourly: { path: () => `/api/consumption/hourly?date=${new Date().toISOString().split('T')[0]}`, map: mapHourly, key: 'time' },
    daily: { path: () => { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 7); return `/api/consumption/daily?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`; }, map: mapDaily, key: 'day' },
    monthly: { path: () => '/api/consumption/monthly?months=6', map: mapMonthly, key: 'month' },
};

export function useChartData(view) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const config = VIEW_CONFIG[view];
    const chartKey = config.key;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        apiFetch(config.path())
            .then(raw => { if (!cancelled) setData(config.map(raw)); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [view]);

    return { data, loading, error, chartKey };
}
