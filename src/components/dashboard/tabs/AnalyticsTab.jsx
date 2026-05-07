import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { useChartData } from '../../../hooks/useChartData';

export default function AnalyticsTab({ chartData, chartKey, loading }) {
    // Fetch real daily and hourly data from API
    const daily = useChartData('daily');
    const hourly = useChartData('hourly');

    const hasMonthly = chartData && chartData.length > 0;
    const total = hasMonthly ? chartData.reduce((s, d) => s + (d.units || 0), 0) : 0;
    const avg = hasMonthly ? Math.round(total / chartData.length) : 0;
    const peak = hasMonthly ? chartData.reduce((m, d) => d.units > m.units ? d : m, chartData[0]) : { units: 0 };
    const low = hasMonthly ? chartData.reduce((m, d) => d.units < m.units ? d : m, chartData[0]) : { units: 0 };

    return (
        <>
            <div className="dash-hd"><div><h1>Analytics</h1><div className="dash-hd-meta">Consumption patterns</div></div></div>

            {/* Stats row */}
            <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Total</div>
                    <div className="n-lg">{Math.round(total)}</div>
                    <div className="dash-sub">kWh</div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Avg / Month</div>
                    <div className="n-lg">{avg}</div>
                    <div className="dash-sub">kWh</div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Peak Month</div>
                    <div className="n-lg">{Math.round(peak.units)}</div>
                    <div className="dash-sub">{peak[chartKey] || ''}</div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Lowest</div>
                    <div className="n-lg">{Math.round(low.units)}</div>
                    <div className="dash-sub">{low[chartKey] || ''}</div>
                </div>
            </div>

            {/* Monthly chart — real data from dashboard endpoint */}
            <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Monthly Consumption</div>
                    {loading ? <div className="ch-empty">Loading...</div> : !hasMonthly ? <div className="ch-empty">No data</div> : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={36} />
                                <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3, fontSize: 12, color: '#fff' }} />
                                <Bar dataKey="units" fill="#0047AB" radius={[1, 1, 0, 0]} fillOpacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Daily + Hourly — real data from API */}
            <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Daily (Last 7 Days)</div>
                    {daily.loading ? <div className="ch-empty">Loading...</div> : daily.error ? <div className="ch-empty" style={{ color: '#ff6b6b' }}>{daily.error}</div> : daily.data.length === 0 ? <div className="ch-empty">No daily data</div> : (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={daily.data}>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey={daily.chartKey} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={32} />
                                <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3, fontSize: 12, color: '#fff' }} />
                                <Bar dataKey="units" fill="#0047AB" radius={[1, 1, 0, 0]} fillOpacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Hourly Pattern</div>
                    {hourly.loading ? <div className="ch-empty">Loading...</div> : hourly.error ? <div className="ch-empty" style={{ color: '#ff6b6b' }}>{hourly.error}</div> : hourly.data.length === 0 ? <div className="ch-empty">No hourly data</div> : (
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={hourly.data}>
                                <defs>
                                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0047AB" stopOpacity={0.5} />
                                        <stop offset="100%" stopColor="#0047AB" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey={hourly.chartKey} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} interval={3} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={32} />
                                <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3, fontSize: 12, color: '#fff' }} />
                                <Area type="monotone" dataKey="units" stroke="#0066cc" fill="url(#hg)" strokeWidth={1.8} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </>
    );
}
