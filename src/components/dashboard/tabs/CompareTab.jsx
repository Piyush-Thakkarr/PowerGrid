import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from '../StatCard';

export default function CompareTab({ comparison, user, thisMonthUnits }) {
    // Use thisMonthUnits consistently as the "your" value everywhere
    const yourUsage = Math.round(thisMonthUnits);
    const barData = [
        { label: 'You', value: yourUsage, fill: '#00aaff' },
        { label: 'Avg Similar', value: comparison.avgSimilar, fill: '#4466ff' },
        { label: 'Efficient (Top 10%)', value: comparison.efficient, fill: '#39FF14' },
        { label: 'Median', value: comparison.median, fill: '#666' },
    ];

    const householdSize = user?.householdSize || '—';
    const state = user?.state || 'your area';
    const diff = Math.abs(yourUsage - comparison.avgSimilar);

    return (
        <>
            <div className="dash-page-header">
                <h1>Compare</h1>
                <span className="dash-page-tag">vs {comparison.totalHouseholds} similar households</span>
            </div>

            <div className="dash-stats-grid four">
                <StatCard label="Your Usage" value={Math.round(thisMonthUnits)} unit="kWh/mo" />
                <StatCard label="Area Average" value={comparison.avgSimilar} unit="kWh/mo" />
                <StatCard label="Your Rank" value={`#${comparison.yourRank}`} unit={`of ${comparison.totalHouseholds}`} />
                <StatCard label="Percentile" value={`Top ${comparison.percentile}%`} unit="" />
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
                    {thisMonthUnits > comparison.avgSimilar ? (
                        <div className="dash-insight warn">
                            <span className="dash-insight-icon">⚠️</span>
                            <div>
                                <strong>Above average</strong>
                                <p>You're using {diff} kWh more than similar {householdSize}-person households in {state}.</p>
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
