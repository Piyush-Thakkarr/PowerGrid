import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useAnomalies } from '../../../hooks/useMLEndpoints';

const SEV_COLOR = { high: '#ff4d4f', medium: '#febc2e', low: '#82C8E5' };

export default function AnomaliesTab({ mock }) {
    const { data: fetched, loading, error } = useAnomalies(2.0, { skip: !!mock });
    const data = mock || fetched;

    if (!mock && loading) return <div className="role-loading">Loading anomalies…</div>;
    if (!mock && error) return <div className="role-error">⚠ {error}</div>;

    const anomalies = data?.anomalies || [];
    const dec = data?.decomposition;
    const decomp = (dec?.dates || []).map((d, i) => ({
        date: d,
        observed: dec.observed?.[i],
        trend: dec.trend?.[i],
        seasonal: dec.seasonal?.[i],
        residual: dec.residual?.[i],
    }));

    return (
        <div className="role-stack">
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Anomalies</span><span className="role-stat-v">{data?.anomalyCount || 0}</span></div>
                <div className="role-stat"><span className="role-stat-l">Days analyzed</span><span className="role-stat-v">{data?.totalDays || 0}</span></div>
            </div>

            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Detected anomalies</span></div>
                <div className="role-table-wrap">
                    <table className="role-table">
                        <thead><tr><th>Date</th><th>Actual</th><th>Expected</th><th>Deviation</th><th>Z-score</th><th>Severity</th></tr></thead>
                        <tbody>
                            {anomalies.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.5)' }}>No anomalies detected ✨</td></tr>}
                            {anomalies.map((a, i) => (
                                <tr key={i}>
                                    <td>{a.date}</td>
                                    <td>{a.actual?.toFixed(2)}</td>
                                    <td>{a.expected?.toFixed(2)}</td>
                                    <td>{a.deviationPercent > 0 ? '+' : ''}{a.deviationPercent?.toFixed(1)}%</td>
                                    <td>{a.zScore?.toFixed(2)}</td>
                                    <td><span className="role-pill" style={{ color: SEV_COLOR[a.severity] || '#fff', borderColor: (SEV_COLOR[a.severity] || '#fff') + '40' }}>{a.severity}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {decomp.length > 0 && (
                <div className="role-card">
                    <div className="role-card-head"><span className="role-card-title">Time-series decomposition</span></div>
                    <div className="role-chart">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={decomp}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="observed" stroke="#82C8E5" dot={false} strokeWidth={1.5} />
                                <Line type="monotone" dataKey="trend" stroke="#00aaff" dot={false} strokeWidth={1.5} />
                                <Line type="monotone" dataKey="seasonal" stroke="#0066cc" dot={false} strokeWidth={1} />
                                <Line type="monotone" dataKey="residual" stroke="#ff4d4f" dot={false} strokeWidth={1} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
