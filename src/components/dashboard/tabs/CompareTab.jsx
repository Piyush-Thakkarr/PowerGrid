import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function CompareTab({ comparison, loading, user }) {
    if (loading || !comparison) return <div className="ch-empty">Loading comparison data...</div>;

    const you = Math.round(comparison.yourMonthlyKwh || 0);
    const bars = [
        { label: 'You', value: you, c: '#0066cc' },
        { label: 'State Avg', value: Math.round(comparison.stateAvgKwh || 0), c: 'rgba(255,255,255,0.55)' },
        { label: 'Similar HH', value: Math.round(comparison.similarHouseholdKwh || 0), c: 'rgba(255,255,255,0.4)' },
        { label: 'National', value: Math.round(comparison.nationalAvgKwh || 0), c: 'rgba(255,255,255,0.28)' },
    ];
    const diff = Math.abs(you - Math.round(comparison.stateAvgKwh || 0));
    const above = you > (comparison.stateAvgKwh || 0);

    return (
        <>
            <div className="dash-hd"><div><h1>Compare</h1><div className="dash-hd-meta">vs {comparison.totalUsers || 0} households</div></div></div>

            <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
                <div className="dash-c"><div className="dash-lbl">Your Usage</div><div className="n-lg">{you}</div><div className="dash-sub">kWh/mo</div></div>
                <div className="dash-c"><div className="dash-lbl">State Avg</div><div className="n-lg">{Math.round(comparison.stateAvgKwh || 0)}</div><div className="dash-sub">kWh/mo</div></div>
                <div className="dash-c"><div className="dash-lbl">Rank</div><div className="n-lg">#{comparison.yourRank || '—'}</div><div className="dash-sub">of {comparison.totalUsers || '—'}</div></div>
                <div className="dash-c"><div className="dash-lbl">Percentile</div><div className="n-lg">Top {comparison.percentile || '—'}%</div></div>
            </div>

            <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Household Comparison</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={bars} layout="vertical">
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" />
                            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3, fontSize: 12, color: '#fff' }} formatter={v => [`${v} kWh`, '']} />
                            <Bar dataKey="value" radius={[0, 2, 2, 0]}>{bars.map((b, i) => <Cell key={i} fill={b.c} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Insight</div>
                    <div className="dash-sub" style={{ fontSize: '.85rem', color: 'rgba(255,255,255,0.85)', marginTop: 0 }}>
                        {above ? `You're using ${diff} kWh more than the state average.` : `You're using ${diff} kWh less than the state average.`}
                    </div>
                </div>
            </div>
        </>
    );
}
