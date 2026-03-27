import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, Area, AreaChart } from 'recharts';
import { useMLForecast, useMLAnomalies, useMLDecomposition, useMLPeakHours, useMLRecommendations } from '../../../hooks/useMLData';

function LoadingCard({ title }) {
    return (
        <div className="dash-card">
            <div className="dash-card-header"><h2>{title}</h2></div>
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3, fontFamily: "'DM Mono', monospace", fontSize: '.75rem' }}>
                Loading...
            </div>
        </div>
    );
}

function ErrorCard({ title, error }) {
    return (
        <div className="dash-card">
            <div className="dash-card-header"><h2>{title}</h2></div>
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, color: '#ff4466', fontFamily: "'DM Mono', monospace", fontSize: '.75rem' }}>
                {error}
            </div>
        </div>
    );
}

function ForecastSection() {
    const { data, loading, error } = useMLForecast();
    if (loading) return <LoadingCard title="7-Day Forecast" />;
    if (error) return <ErrorCard title="7-Day Forecast" error={error} />;
    if (!data) return null;

    const chartData = (data.sarima?.predictions || []).map((s, i) => ({
        date: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sarima: Math.round(s.predicted * 100) / 100,
        prophet: data.prophet?.predictions?.[i] ? Math.round(data.prophet.predictions[i].predicted * 100) / 100 : null,
    }));

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h2>7-Day Forecast</h2>
                <span className="dash-section-tag">Best: {data.bestModel || 'SARIMA'}</span>
            </div>
            <div className="dash-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                        <Line type="monotone" dataKey="sarima" stroke="#00aaff" strokeWidth={2} dot={false} name="SARIMA" />
                        <Line type="monotone" dataKey="prophet" stroke="#39FF14" strokeWidth={2} dot={false} name="Prophet" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function AnomalySection() {
    const { data, loading, error } = useMLAnomalies();
    if (loading) return <LoadingCard title="Anomaly Detection" />;
    if (error) return <ErrorCard title="Anomaly Detection" error={error} />;
    if (!data) return null;

    const severityColor = { high: '#ff4466', medium: '#ffaa00', low: '#00aaff' };

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h2>Anomaly Detection</h2>
                <span className="dash-section-tag">{data.anomalyCount || 0} detected</span>
            </div>
            <div style={{ padding: '0 1.3rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {(data.anomalies || []).slice(0, 5).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.6rem .8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${severityColor[a.severity] || '#666'}` }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '.7rem', opacity: 0.5 }}>Actual: {a.actual?.toFixed(1)} kWh — Expected: {a.expected?.toFixed(1)} kWh</div>
                        </div>
                        <div style={{ fontSize: '.75rem', color: severityColor[a.severity], fontWeight: 600 }}>+{a.deviationPercent}%</div>
                    </div>
                ))}
                {(data.anomalies || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.3, fontSize: '.75rem' }}>No anomalies detected</div>
                )}
            </div>
        </div>
    );
}

function PeakHoursSection() {
    const { data, loading, error } = useMLPeakHours();
    if (loading) return <LoadingCard title="Peak Hours" />;
    if (error) return <ErrorCard title="Peak Hours" error={error} />;
    if (!data) return null;

    const chartData = (data.hourlyProfile || []).map(h => ({
        hour: `${String(h.hour).padStart(2, '0')}:00`,
        kwh: Math.round(h.avgKwh * 100) / 100,
        isPeak: (data.peakHours || []).includes(h.hour),
    }));

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h2>Peak Hours Analysis</h2>
                <span className="dash-section-tag">Peak: {(data.peakHours || []).map(h => `${h}:00`).join(', ') || '—'}</span>
            </div>
            <div className="dash-chart-wrap">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                        <Bar dataKey="kwh" radius={[3, 3, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.isPeak ? '#ff4466' : '#39FF14'} fillOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function RecommendationsSection() {
    const { data, loading, error } = useMLRecommendations();
    if (loading) return <LoadingCard title="Recommendations" />;
    if (error) return <ErrorCard title="Recommendations" error={error} />;
    if (!data || data.length === 0) return null;

    const priorityColor = { high: '#ff4466', medium: '#ffaa00', low: '#39FF14' };

    return (
        <div className="dash-card">
            <div className="dash-card-header"><h2>AI Recommendations</h2></div>
            <div style={{ padding: '0 1.3rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {data.map(rec => (
                    <div key={rec.id} style={{ padding: '.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${priorityColor[rec.priority] || '#666'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                            <strong style={{ fontSize: '.85rem' }}>{rec.title}</strong>
                            <span style={{ fontSize: '.75rem', color: '#39FF14', fontWeight: 600 }}>Save ₹{rec.estimatedSavings}/mo</span>
                        </div>
                        <p style={{ fontSize: '.7rem', opacity: 0.5, margin: 0 }}>{rec.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MLTab() {
    return (
        <>
            <div className="dash-page-header">
                <h1>AI Insights</h1>
                <span className="dash-page-tag">Machine Learning</span>
            </div>
            <ForecastSection />
            <AnomalySection />
            <PeakHoursSection />
            <RecommendationsSection />
        </>
    );
}
