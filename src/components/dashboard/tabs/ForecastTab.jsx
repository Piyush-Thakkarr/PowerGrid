import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useForecast } from '../../../hooks/useMLEndpoints';

export default function ForecastTab() {
    const [horizon, setHorizon] = useState(7);
    const { data, loading, error } = useForecast(horizon);

    if (loading) return <div className="role-loading">Loading forecast…</div>;
    if (error) return <div className="role-error">⚠ {error}</div>;

    const series = data?.predictions || [];
    const features = data?.topFeatures || [];

    return (
        <div className="role-stack">
            <div className="role-card">
                <div className="role-card-head">
                    <span className="role-card-title">Consumption forecast</span>
                    <div className="role-toggle">
                        <button className={horizon === 7 ? 'on' : ''} onClick={() => setHorizon(7)}>7 days</button>
                        <button className={horizon === 14 ? 'on' : ''} onClick={() => setHorizon(14)}>14 days</button>
                    </div>
                </div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={series}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                            <Line type="monotone" dataKey="predicted" stroke="#00aaff" strokeWidth={2} dot={{ fill: '#00aaff', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="role-card-meta" style={{ marginTop: '.6rem' }}>Model: {data?.model || '—'}</div>
            </div>

            {features.length > 0 && (
                <div className="role-card">
                    <div className="role-card-head"><span className="role-card-title">Top model features</span></div>
                    <div className="role-table-wrap">
                        <table className="role-table">
                            <thead><tr><th>Feature</th><th>Importance</th></tr></thead>
                            <tbody>
                                {features.map(f => (
                                    <tr key={f.name}><td>{f.name}</td><td>{f.importance?.toFixed(4)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
