import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import StatCard from '../StatCard';
import CustomTooltip from '../CustomTooltip';

export default function AnalyticsTab({ data, chartView, setChartView, chartData, chartKey }) {
    const [activeCell, setActiveCell] = useState(null);
    const peakHour = data.hourly.reduce((max, h) => h.units > max.units ? h : max, data.hourly[0]);
    const lowHour = data.hourly.reduce((min, h) => h.units < min.units ? h : min, data.hourly[0]);
    const avgHourly = (data.hourly.reduce((s, h) => s + h.units, 0) / data.hourly.length).toFixed(2);

    return (
        <>
            <div className="dash-page-header">
                <h1>Analytics</h1>
                <span className="dash-page-tag">Consumption patterns</span>
            </div>

            <div className="dash-stats-grid four">
                <StatCard label="Peak Hour" value={peakHour.time} unit={`${peakHour.units} kWh`} />
                <StatCard label="Lowest Hour" value={lowHour.time} unit={`${lowHour.units} kWh`} />
                <StatCard label="Avg Hourly" value={avgHourly} unit="kWh" />
                <StatCard label="Peak/Avg Ratio" value={(peakHour.units / parseFloat(avgHourly)).toFixed(1)} unit="x" />
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Usage Over Time</h2>
                    <div className="dash-view-toggle" role="tablist" aria-label="Chart time range">
                        {['hourly', 'daily', 'monthly'].map(v => (
                            <button key={v} role="tab" aria-selected={chartView === v} className={chartView === v ? 'active' : ''} onClick={() => setChartView(v)}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="dash-chart-wrap">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="units" radius={[3, 3, 0, 0]}>
                                {(() => {
                                    const avg = chartData.reduce((s, e) => s + e.units, 0) / chartData.length;
                                    return chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.units > avg * 1.5 ? '#ff4466' : '#00aaff'} fillOpacity={0.7} />
                                    ));
                                })()}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Weekly Heatmap</h2>
                    <span className="dash-section-tag">Time-of-day patterns</span>
                </div>
                <div className="dash-heatmap">
                    <div className="dash-heatmap-ylabels">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="dash-heatmap-grid">
                        {data.heatmap.map((cell, i) => (
                            <div key={i} className={`dash-heatmap-cell ${activeCell === i ? 'active' : ''}`}
                                role="button" tabIndex={0}
                                aria-label={`${cell.day} ${String(cell.hour).padStart(2, '0')}:00 — ${cell.value} kWh`}
                                style={{ opacity: Math.min(1, 0.15 + cell.value * 0.45) }}
                                title={`${cell.day} ${String(cell.hour).padStart(2, '0')}:00 — ${cell.value} kWh`}
                                onClick={() => setActiveCell(activeCell === i ? null : i)}
                                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActiveCell(activeCell === i ? null : i)} />
                        ))}
                    </div>
                    {activeCell !== null && data.heatmap[activeCell] && (
                        <div className="dash-heatmap-tooltip">
                            {data.heatmap[activeCell].day} {String(data.heatmap[activeCell].hour).padStart(2, '0')}:00 — {data.heatmap[activeCell].value} kWh
                        </div>
                    )}
                    <div className="dash-heatmap-xlabels">
                        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => <span key={h}>{String(h).padStart(2, '0')}</span>)}
                    </div>
                </div>
            </div>
        </>
    );
}
