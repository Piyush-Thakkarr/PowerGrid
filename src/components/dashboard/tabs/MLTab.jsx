import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { useMLForecast, useMLAnomalies, useMLPeakHours, useMLRecommendations } from '../../../hooks/useMLData';

function Loading({ t }) { return <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}><div className="dash-c"><div className="dash-lbl">{t}</div><div className="ch-empty">Loading...</div></div></div>; }
function Err({ t, e }) { return <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}><div className="dash-c"><div className="dash-lbl">{t}</div><div className="ch-empty" style={{ color: '#ff6b6b' }}>{e}</div></div></div>; }

function Forecast() {
    const { data, loading, error } = useMLForecast();
    if (loading) return <Loading t="7-Day Forecast" />;
    if (error) return <Err t="7-Day Forecast" e={error} />;
    if (!data) return null;
    const preds = data.sarima?.predictions || data.neural?.predictions || [];
    const chartData = preds.map(s => ({ date: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), kWh: Math.round(s.predicted * 100) / 100 }));
    return (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
            <div className="dash-c">
                <div className="dash-lbl">7-Day Forecast <span style={{ fontWeight: 400, letterSpacing: 0 }}>{data.bestModel || 'SARIMA'}</span></div>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 12 }} />
                        <Line type="monotone" dataKey="kWh" stroke="#0066cc" strokeWidth={1.2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function Anomalies() {
    const { data, loading, error } = useMLAnomalies();
    if (loading) return <Loading t="Anomalies" />;
    if (error) return <Err t="Anomalies" e={error} />;
    if (!data) return null;
    return (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
            <div className="dash-c">
                <div className="dash-lbl">Anomalies <span className="an-count">{data.anomalyCount || 0} detected</span></div>
                <div className="an-list">
                    {(data.anomalies || []).slice(0, 6).map((a, i) => (
                        <div className="an-row" key={i}>
                            <div className="an-bar" style={{ background: a.severity === 'high' ? '#ff6b6b' : a.severity === 'medium' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' }} />
                            <div className="an-info"><div className="an-date">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div><div className="an-detail">{a.actual?.toFixed(1)} kWh vs {a.expected?.toFixed(1)} expected</div></div>
                            <span className="an-pct">{a.deviationPercent > 0 ? '+' : ''}{a.deviationPercent}%</span>
                        </div>
                    ))}
                    {(data.anomalies || []).length === 0 && <div className="ch-empty">No anomalies detected</div>}
                </div>
            </div>
        </div>
    );
}

function PeakHours() {
    const { data, loading, error } = useMLPeakHours();
    if (loading) return <Loading t="Peak Hours" />;
    if (error) return <Err t="Peak Hours" e={error} />;
    if (!data) return null;
    const chartData = (data.hourlyProfile || []).map(h => ({ hour: `${String(h.hour).padStart(2, '0')}`, watts: Math.round(h.avgWatts || h.avgKwh * 1000 || 0), isPeak: (data.peakHours || []).includes(h.hour) }));
    return (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
            <div className="dash-c">
                <div className="dash-lbl">Peak Hours <span className="an-count">Peak: {(data.peakHours || []).map(h => `${h}:00`).join(', ')}</span></div>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.12)', fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 12 }} />
                        <Bar dataKey="watts" radius={[1, 1, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.isPeak ? '#0066cc' : 'rgba(255,255,255,0.04)'} />)}</Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function Recommendations() {
    const { data, loading, error } = useMLRecommendations();
    if (loading) return <Loading t="Recommendations" />;
    if (error) return <Err t="Recommendations" e={error} />;
    if (!data || data.length === 0) return null;
    return (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="dash-c">
                <div className="dash-lbl">Recommendations</div>
                <div className="an-list">
                    {data.map(r => (
                        <div className="an-row" key={r.id}>
                            <div className="an-bar" style={{ background: r.priority === 'high' ? '#ff6b6b' : r.priority === 'medium' ? 'rgba(255,255,255,0.2)' : '#0047AB' }} />
                            <div className="an-info"><div className="an-date">{r.title}</div><div className="an-detail">{r.description}</div></div>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: '#00aaff', flexShrink: 0 }}>{r.estimatedSavings}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function MLTab() {
    return (
        <>
            <div className="dash-hd"><div><h1>AI Insights</h1><div className="dash-hd-meta">Machine Learning</div></div></div>
            <Forecast />
            <Anomalies />
            <PeakHours />
            <Recommendations />
        </>
    );
}
