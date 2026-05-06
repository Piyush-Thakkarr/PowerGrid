import React from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApplianceBreakdown } from '../../../hooks/useMLEndpoints';

const COLORS = ['#00aaff', '#82C8E5', '#0066cc', '#0047AB', '#5db4d8', '#88e0ff'];

export default function ApplianceTab({ mock }) {
    const { data: fetched, loading, error } = useApplianceBreakdown(30, { skip: !!mock });
    const data = mock || fetched;

    if (!mock && loading) return <div className="role-loading">Loading appliance breakdown…</div>;
    if (!mock && error) return <div className="role-error">⚠ {error}</div>;

    const breakdown = data?.breakdown || [];
    const components = data?.nmfComponents || [];

    return (
        <div className="role-stack">
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Total kWh (30d)</span><span className="role-stat-v">{data?.totalKwh?.toFixed(1) || '—'}</span></div>
                <div className="role-stat"><span className="role-stat-l">Data points</span><span className="role-stat-v">{data?.dataPoints || '—'}</span></div>
            </div>

            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Appliance breakdown · last 30 days</span></div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={breakdown} dataKey="estimatedKwh" nameKey="appliance" cx="50%" cy="50%" outerRadius={100} label={(d) => `${d.appliance} ${d.percentage?.toFixed(0)}%`} labelLine={false}>
                                {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {components.length > 0 && (
                <div className="role-card">
                    <div className="role-card-head"><span className="role-card-title">NMF components · 24h activity profile</span></div>
                    <div className="role-stack">
                        {components.map(c => (
                            <div key={c.componentId}>
                                <div className="role-card-meta" style={{ marginBottom: '.5rem' }}>Component #{c.componentId} · peak {c.peakHour}h</div>
                                <ResponsiveContainer width="100%" height={100}>
                                    <AreaChart data={(c.hourlyProfile || []).map((v, i) => ({ hour: i, v }))}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                        <Area type="monotone" dataKey="v" stroke="#00aaff" fill="rgba(0,170,255,0.2)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
