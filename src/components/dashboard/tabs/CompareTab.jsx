import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from '../StatCard';

export default function CompareTab({ comparison, loading, user }) {
    if (loading || !comparison) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3, fontFamily: "'DM Mono', monospace", fontSize: '.85rem' }}>
                Loading comparison data...
            </div>
        );
    }

    const yourUsage = Math.round(comparison.yourMonthlyKwh || 0);
    const barData = [
        { label: 'You', value: yourUsage, fill: '#00aaff' },
        { label: 'State Avg', value: Math.round(comparison.stateAvgKwh || 0), fill: '#4466ff' },
        { label: 'Similar HH', value: Math.round(comparison.similarHouseholdKwh || 0), fill: '#39FF14' },
        { label: 'National Avg', value: Math.round(comparison.nationalAvgKwh || 0), fill: '#666' },
    ];

    const householdSize = comparison.householdSize || user?.householdSize || '—';
    const state = comparison.state || user?.state || 'your area';
    const diff = Math.abs(yourUsage - Math.round(comparison.stateAvgKwh || 0));

    return (
        <>
            <div className="dash-page-header">
                <h1>Compare</h1>
                <span className="dash-page-tag">vs {comparison.totalUsers || 0} households</span>
            </div>

            <div className="dash-stats-grid four">
                <StatCard label="Your Usage" value={yourUsage} unit="kWh/mo" />
                <StatCard label="State Avg" value={Math.round(comparison.stateAvgKwh || 0)} unit="kWh/mo" />
                <StatCard label="Your Rank" value={`#${comparison.yourRank || '—'}`} unit={`of ${comparison.totalUsers || '—'}`} />
                <StatCard label="Percentile" value={`Top ${comparison.percentile || '—'}%`} unit="" />
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Household Comparison</h2></div>
                <div className="dash-chart-wrap">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                            <Tooltip formatter={(v) => [`${v} kWh`, '']} contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.75} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Insights</h2></div>
                <div className="dash-insights">
                    {yourUsage > (comparison.stateAvgKwh || 0) ? (
                        <div className="dash-insight warn">
                            <span className="dash-insight-icon">⚠️</span>
                            <div>
                                <strong>Above average</strong>
                                <p>You're using {diff} kWh more than the state average for {householdSize}-person households in {state}.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="dash-insight good">
                            <span className="dash-insight-icon">✅</span>
                            <div>
                                <strong>Great job!</strong>
                                <p>You're using {diff} kWh less than average for {state}.</p>
                            </div>
                        </div>
                    )}
                    <div className="dash-insight info">
                        <span className="dash-insight-icon">💡</span>
                        <div>
                            <strong>Tip: Shift heavy loads</strong>
                            <p>Moving AC/geyser usage to off-peak hours (10PM-6AM) could save up to ₹1,200 per month based on your tariff slab.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
