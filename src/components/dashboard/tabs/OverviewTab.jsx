import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../StatCard';
import CustomTooltip from '../CustomTooltip';

export default function OverviewTab({ liveWatts, todayUnits, thisMonthUnits, monthChange, bill, gamification, chartData, chartKey, chartView, setChartView, loading }) {
    const billTotal = bill?.totalCost || bill?.total || 0;
    const xp = gamification?.xp || 0;
    const level = gamification?.level || 1;

    return (
        <>
            <div className="dash-page-header">
                <h1>Dashboard</h1>
                <span className="dash-page-tag">Real-time monitoring</span>
            </div>

            <div className="dash-overview-top">
                <div className="dash-orb-card">
                    <div className="dash-orb">
                        <div className="dash-orb-ring"></div>
                        <div className="dash-orb-ring r2"></div>
                        <div className="dash-orb-inner">
                            <span className="dash-orb-value">{liveWatts}</span>
                            <span className="dash-orb-unit">W</span>
                        </div>
                    </div>
                    <span className="dash-orb-label">Live Power Draw</span>
                </div>
                <div className="dash-stats-grid">
                    <StatCard label="Today" value={todayUnits.toFixed(1)} unit="kWh" />
                    <StatCard label="This Month" value={Math.round(thisMonthUnits)} unit="kWh" trend={Math.round(monthChange)} />
                    <StatCard label="Est. Bill" value={`₹${Math.round(billTotal).toLocaleString('en-IN')}`} unit="" />
                    <StatCard label="XP" value={xp} unit={`Lvl ${level}`} />
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Consumption</h2>
                    <div className="dash-view-toggle" role="tablist" aria-label="Chart time range">
                        {['hourly', 'daily', 'monthly'].map(v => (
                            <button key={v} role="tab" aria-selected={chartView === v} className={chartView === v ? 'active' : ''} onClick={() => setChartView(v)}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="dash-chart-wrap">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3, fontFamily: "'DM Mono', monospace", fontSize: '.75rem' }}>Loading chart data...</div>
                    ) : chartData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.3, fontFamily: "'DM Mono', monospace", fontSize: '.75rem' }}>No data available for this period</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00aaff" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#00aaff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="units" stroke="#00aaff" fill="url(#grad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </>
    );
}
