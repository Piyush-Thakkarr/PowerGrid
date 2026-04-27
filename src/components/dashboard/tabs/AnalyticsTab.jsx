import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

export default function AnalyticsTab({ chartData, chartKey, loading }) {
    if (loading) return <div className="ch-empty">Loading...</div>;
    if (!chartData || chartData.length === 0) return <div className="ch-empty">No data</div>;

    const total = chartData.reduce((s, d) => s + (d.units || 0), 0);
    const avg = Math.round(total / chartData.length);
    const peak = chartData.reduce((m, d) => d.units > m.units ? d : m, chartData[0]);
    const low = chartData.reduce((m, d) => d.units < m.units ? d : m, chartData[0]);

    // Simulated daily data for current week
    const dailyData = [
        { day: 'Mon', kwh: 3.8 }, { day: 'Tue', kwh: 5.1 }, { day: 'Wed', kwh: 4.4 },
        { day: 'Thu', kwh: 3.2 }, { day: 'Fri', kwh: 6.8 }, { day: 'Sat', kwh: 5.5 }, { day: 'Sun', kwh: 4.2 },
    ];

    // Simulated hourly pattern
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const base = i >= 17 && i <= 22 ? 1.2 : i >= 6 && i <= 9 ? 0.8 : i >= 10 && i <= 16 ? 0.4 : 0.15;
        return { hour: String(i).padStart(2, '0'), kwh: Math.round(base * 100) / 100 };
    });

    return (
        <>
            <div className="dash-hd"><div><h1>Analytics</h1><div className="dash-hd-meta">Consumption patterns</div></div></div>

            {/* Stats row */}
            <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Total (7 mo)</div>
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
                    <div className="dash-sub">{peak[chartKey]}</div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Lowest</div>
                    <div className="n-lg">{Math.round(low.units)}</div>
                    <div className="dash-sub">{low[chartKey]}</div>
                </div>
            </div>

            {/* Monthly chart */}
            <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Monthly Consumption</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey={chartKey} tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 12 }} />
                            <Bar dataKey="units" fill="#0047AB" radius={[1, 1, 0, 0]} fillOpacity={0.7} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Daily + Hourly side by side */}
            <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="dash-c">
                    <div className="dash-lbl">This Week · Daily</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={25} />
                            <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 11 }} />
                            <Bar dataKey="kwh" fill="#0047AB" radius={[1, 1, 0, 0]} fillOpacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Avg Hourly Pattern</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0047AB" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#0047AB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.02)" />
                            <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.12)', fontSize: 8, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} interval={3} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.1)', fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={25} />
                            <Tooltip cursor={false} contentStyle={{ background: '#050508', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 11 }} />
                            <Area type="monotone" dataKey="kwh" stroke="#0066cc" fill="url(#hg)" strokeWidth={1.2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}
