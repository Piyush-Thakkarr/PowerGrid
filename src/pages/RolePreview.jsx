import '../styles/dashboard.css';
import '../styles/role.css';
import React, { useState } from 'react';
import { LayoutDashboard, Users, TrendingUp, Receipt, BarChart3, Map, PieChart as PieIcon, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

// ── Mock Data ──
const DISCOM_DATA = {
    overview: { totalConsumers: 10, totalKwh30d: 14250.5, avgLoadWatts: 168.7, peakLoadWatts: 4428, state: 'Maharashtra' },
    segmentation: { clusters: [
        { clusterId: 0, userCount: 66, peakHour: 22, dailyAvgKwh: 4.1, hourlyProfile: [0.05,0.03,0.02,0.04,0.03,0.03,0.05,0.07,0.09,0.08,0.08,0.09,0.13,0.12,0.07,0.08,0.08,0.07,0.1,0.12,0.14,0.17,0.22,0.17] },
        { clusterId: 1, userCount: 7, peakHour: 0, dailyAvgKwh: 15.9, hourlyProfile: [1.2,0.9,0.8,0.7,0.6,0.5,0.6,0.7,0.8,0.7,0.6,0.7,0.8,0.9,0.7,0.6,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2] },
        { clusterId: 2, userCount: 12, peakHour: 0, dailyAvgKwh: 27.9, hourlyProfile: [2.1,1.8,1.6,1.5,1.4,1.3,1.4,1.5,1.7,1.6,1.5,1.6,1.8,2.0,1.7,1.6,1.5,1.6,1.8,2.0,2.2,2.4,2.6,2.3] },
    ]},
    demand: { demandCurve: Array.from({length: 24}, (_, i) => ({ hour: `${String(i).padStart(2,'0')}:00`, totalWatts: 8000 + Math.sin(i/24*Math.PI*2)*4000 + Math.random()*1000, activeUsers: 10, avgPerUser: 800+Math.random()*200 })), peakDemand: { totalWatts: 14200, hour: '22:00' }, valleyDemand: { totalWatts: 4100, hour: '04:00' } },
    consumers: { consumers: [
        { userId: '1', email: 'aarav@demo.com', state: 'Maharashtra', monthlyKwh: 245.2, avgWatts: 340.1 },
        { userId: '2', email: 'priya@demo.com', state: 'Maharashtra', monthlyKwh: 198.5, avgWatts: 275.3 },
        { userId: '3', email: 'vikram@demo.com', state: 'Maharashtra', monthlyKwh: 312.8, avgWatts: 434.4 },
        { userId: '4', email: 'meera@demo.com', state: 'Maharashtra', monthlyKwh: 156.3, avgWatts: 217.1 },
        { userId: '5', email: 'rahul@demo.com', state: 'Maharashtra', monthlyKwh: 289.1, avgWatts: 401.5 },
    ], total: 5, page: 1, pageSize: 25, totalPages: 1 },
    revenue: { byPlan: [{ plan: 'Residential', userCount: 8, totalKwh: 9450 }, { plan: 'Commercial', userCount: 3, totalKwh: 3200 }, { plan: 'Industrial', userCount: 1, totalKwh: 1600 }] },
};

const GOV_DATA = {
    overview: { totalStates: 8, totalConsumers: 53, totalKwh: 38420, byState: [
        { state: 'Maharashtra', consumers: 12, totalKwh: 8930 },
        { state: 'Gujarat', consumers: 9, totalKwh: 7210 },
        { state: 'Uttar Pradesh', consumers: 8, totalKwh: 6540 },
        { state: 'West Bengal', consumers: 7, totalKwh: 5120 },
        { state: 'Tamil Nadu', consumers: 6, totalKwh: 4280 },
        { state: 'Delhi', consumers: 5, totalKwh: 3150 },
        { state: 'Rajasthan', consumers: 4, totalKwh: 2100 },
        { state: 'Kerala', consumers: 2, totalKwh: 1090 },
    ]},
    tariff: { distribution: [
        { state: 'Maharashtra', plan: 'Residential', userCount: 10 },
        { state: 'Maharashtra', plan: 'Commercial', userCount: 2 },
        { state: 'Gujarat', plan: 'Residential', userCount: 9 },
        { state: 'Uttar Pradesh', plan: 'Residential', userCount: 7 },
        { state: 'Uttar Pradesh', plan: 'Industrial', userCount: 1 },
        { state: 'Delhi', plan: 'Residential', userCount: 5 },
    ]},
    trend: { trend: [
        { month: '2025-10', totalKwh: 42100, activeUsers: 48 },
        { month: '2025-11', totalKwh: 51200, activeUsers: 50 },
        { month: '2025-12', totalKwh: 47800, activeUsers: 51 },
        { month: '2026-01', totalKwh: 39500, activeUsers: 52 },
        { month: '2026-02', totalKwh: 35200, activeUsers: 53 },
        { month: '2026-03', totalKwh: 38420, activeUsers: 53 },
    ]},
};

const GRID_DATA = {
    demand: DISCOM_DATA.demand,
    peaks: { peakHistory: Array.from({length: 30}, (_, i) => ({ date: `2026-03-${String(i+1).padStart(2,'0')}`, peakWatts: 10000 + Math.random()*5000, peakHour: Math.floor(Math.random()*4)+20 })), maxPeak: 14850 },
    load: { areas: [
        { state: 'Maharashtra', totalLoadWatts: 48200, activeMeters: 12, avgPerMeter: 4016.7 },
        { state: 'Gujarat', totalLoadWatts: 35100, activeMeters: 9, avgPerMeter: 3900.0 },
        { state: 'Uttar Pradesh', totalLoadWatts: 31200, activeMeters: 8, avgPerMeter: 3900.0 },
        { state: 'West Bengal', totalLoadWatts: 27800, activeMeters: 7, avgPerMeter: 3971.4 },
        { state: 'Tamil Nadu', totalLoadWatts: 22500, activeMeters: 6, avgPerMeter: 3750.0 },
        { state: 'Delhi', totalLoadWatts: 19200, activeMeters: 5, avgPerMeter: 3840.0 },
    ]},
};

const mockUser = { name: 'Demo Admin', email: 'admin@powergrid.in' };

// ── Shared Components ──
function RoleSidebarPreview({ tabs, tab, onTabChange, title }) {
    return (
        <div className="dash-side">
            <div className="dash-side-logo" style={{ cursor: 'default' }}>
                <svg viewBox="0 0 28 28" fill="none" width="24" height="24">
                    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="rgba(0,170,255,0.4)" strokeWidth="1" />
                    <circle cx="14" cy="14" r="1.5" fill="#00aaff" />
                </svg>
            </div>
            <div className="dash-side-nav">
                {tabs.map(t => (
                    <button key={t.id} className={`dash-side-btn${tab === t.id ? ' active' : ''}`}
                        onClick={() => onTabChange(t.id)} title={t.label}>
                        {t.Icon && <t.Icon size={16} strokeWidth={1.5} />}
                    </button>
                ))}
            </div>
            <div className="dash-side-bottom">
                <div className="dash-side-av">{title?.charAt(0) || 'P'}</div>
            </div>
        </div>
    );
}

// ── DISCOM Preview ──
function DiscomPreview({ switcher }) {
    const [tab, setTab] = useState('overview');
    const tabs = [
        { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
        { id: 'segmentation', label: 'Customer Groups', Icon: BarChart3 },
        { id: 'demand', label: 'Demand', Icon: TrendingUp },
        { id: 'consumers', label: 'Consumers', Icon: Users },
        { id: 'revenue', label: 'Revenue', Icon: Receipt },
    ];
    return (
        <div className="dash-page">
            <RoleSidebarPreview tabs={tabs} tab={tab} onTabChange={setTab} title="DISCOM" />
            <main className="dash-main">
                <header className="role-header">
                    {switcher}
                    <span className="role-header-tag">DISCOM Dashboard</span>
                    <h1 className="role-header-title">{tabs.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'overview' && (
                    <div className="role-grid">
                        <div className="role-stat"><span className="role-stat-l">Consumers</span><span className="role-stat-v">{fmt(DISCOM_DATA.overview.totalConsumers)}</span></div>
                        <div className="role-stat"><span className="role-stat-l">Total kWh (30d)</span><span className="role-stat-v">{fmt(DISCOM_DATA.overview.totalKwh30d)}</span></div>
                        <div className="role-stat"><span className="role-stat-l">Avg Load (W)</span><span className="role-stat-v">{fmt(DISCOM_DATA.overview.avgLoadWatts)}</span></div>
                        <div className="role-stat"><span className="role-stat-l">Peak Load (W)</span><span className="role-stat-v">{fmt(DISCOM_DATA.overview.peakLoadWatts)}</span></div>
                        <div className="role-stat role-stat-wide"><span className="role-stat-l">State</span><span className="role-stat-v">{DISCOM_DATA.overview.state}</span></div>
                    </div>
                )}
                {tab === 'segmentation' && (
                    <div className="role-stack">
                        {DISCOM_DATA.segmentation.clusters.map((c, idx) => (
                            <div key={c.clusterId} className="role-card">
                                <div className="role-card-head">
                                    <span className="role-card-title">Group {String.fromCharCode(65 + idx)}</span>
                                    <span className="role-card-meta">{fmt(c.userCount)} consumers · busiest at {c.peakHour}:00 · {c.dailyAvgKwh} kWh/day</span>
                                </div>
                                <div className="role-chart">
                                    <ResponsiveContainer width="100%" height={140}>
                                        <AreaChart data={c.hourlyProfile.map((v, i) => ({ hour: i, kwh: v }))}>
                                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                            <Area type="monotone" dataKey="kwh" stroke="#00aaff" fill="rgba(0,170,255,0.2)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {tab === 'demand' && (
                    <>
                        <div className="role-grid">
                            <div className="role-stat"><span className="role-stat-l">Peak Demand</span><span className="role-stat-v">{fmt(DISCOM_DATA.demand.peakDemand.totalWatts)} W</span></div>
                            <div className="role-stat"><span className="role-stat-l">Valley Demand</span><span className="role-stat-v">{fmt(DISCOM_DATA.demand.valleyDemand.totalWatts)} W</span></div>
                        </div>
                        <div className="role-card">
                            <div className="role-card-head"><span className="role-card-title">24h Demand Curve</span></div>
                            <div className="role-chart">
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={DISCOM_DATA.demand.demandCurve}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                        <Area type="monotone" dataKey="totalWatts" stroke="#00aaff" fill="rgba(0,170,255,0.25)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
                {tab === 'consumers' && (
                    <div className="role-card">
                        <div className="role-card-head"><span className="role-card-title">Consumers</span><span className="role-card-meta">{fmt(DISCOM_DATA.consumers.total)} total</span></div>
                        <div className="role-table-wrap">
                            <table className="role-table">
                                <thead><tr><th>Email</th><th>State</th><th>Monthly kWh</th><th>Avg Watts</th></tr></thead>
                                <tbody>{DISCOM_DATA.consumers.consumers.map(r => (
                                    <tr key={r.userId}><td>{r.email}</td><td>{r.state}</td><td>{r.monthlyKwh}</td><td>{fmt(r.avgWatts)}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
                {tab === 'revenue' && (
                    <div className="role-card">
                        <div className="role-card-head"><span className="role-card-title">Revenue by Plan</span></div>
                        <div className="role-chart">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={DISCOM_DATA.revenue.byPlan}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="plan" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                    <Bar dataKey="totalKwh" fill="#00aaff" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Government Preview ──
function GovernmentPreview({ switcher }) {
    const [tab, setTab] = useState('states');
    const tabs = [
        { id: 'states', label: 'States', Icon: Map },
        { id: 'tariff', label: 'Plan Distribution', Icon: PieIcon },
        { id: 'trend', label: 'Trend', Icon: TrendingUp },
    ];
    return (
        <div className="dash-page">
            <RoleSidebarPreview tabs={tabs} tab={tab} onTabChange={setTab} title="Government" />
            <main className="dash-main">
                <header className="role-header">
                    {switcher}
                    <span className="role-header-tag">Government Dashboard</span>
                    <h1 className="role-header-title">{tabs.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'states' && (
                    <>
                        <div className="role-grid">
                            <div className="role-stat"><span className="role-stat-l">States</span><span className="role-stat-v">{fmt(GOV_DATA.overview.totalStates)}</span></div>
                            <div className="role-stat"><span className="role-stat-l">Consumers</span><span className="role-stat-v">{fmt(GOV_DATA.overview.totalConsumers)}</span></div>
                            <div className="role-stat"><span className="role-stat-l">Total kWh</span><span className="role-stat-v">{fmt(GOV_DATA.overview.totalKwh)}</span></div>
                        </div>
                        <div className="role-card">
                            <div className="role-card-head"><span className="role-card-title">Consumption by State</span></div>
                            <div className="role-chart">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={GOV_DATA.overview.byState} layout="vertical" margin={{ left: 80 }}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="state" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} width={80} />
                                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                        <Bar dataKey="totalKwh" fill="#00aaff" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
                {tab === 'tariff' && (
                    <div className="role-card">
                        <div className="role-card-head"><span className="role-card-title">Plan Distribution · by State</span></div>
                        <div className="role-table-wrap">
                            <table className="role-table">
                                <thead><tr><th>State</th><th>Plan</th><th>Users</th></tr></thead>
                                <tbody>{GOV_DATA.tariff.distribution.map((r, i) => (
                                    <tr key={i}><td>{r.state}</td><td>{r.plan}</td><td>{fmt(r.userCount)}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
                {tab === 'trend' && (
                    <div className="role-card">
                        <div className="role-card-head"><span className="role-card-title">National Consumption · last 6 months</span></div>
                        <div className="role-chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={GOV_DATA.trend.trend}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                    <Line type="monotone" dataKey="totalKwh" stroke="#00aaff" strokeWidth={2} dot={{ fill: '#00aaff', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Grid Operator Preview ──
function GridPreview({ switcher }) {
    const [tab, setTab] = useState('demand');
    const tabs = [
        { id: 'demand', label: 'Demand', Icon: Activity },
        { id: 'peaks', label: 'Peak History', Icon: TrendingUp },
        { id: 'load', label: 'Load by State', Icon: Map },
    ];
    return (
        <div className="dash-page">
            <RoleSidebarPreview tabs={tabs} tab={tab} onTabChange={setTab} title="Grid" />
            <main className="dash-main">
                <header className="role-header">
                    {switcher}
                    <span className="role-header-tag">Grid Operator Dashboard</span>
                    <h1 className="role-header-title">{tabs.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'demand' && (
                    <>
                        <div className="role-grid">
                            <div className="role-stat"><span className="role-stat-l">Peak Demand</span><span className="role-stat-v">{fmt(GRID_DATA.demand.peakDemand.totalWatts)} W</span></div>
                            <div className="role-stat"><span className="role-stat-l">Valley Demand</span><span className="role-stat-v">{fmt(GRID_DATA.demand.valleyDemand.totalWatts)} W</span></div>
                        </div>
                        <div className="role-card">
                            <div className="role-card-head"><span className="role-card-title">Grid demand · 24h</span></div>
                            <div className="role-chart">
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={GRID_DATA.demand.demandCurve}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                        <Area type="monotone" dataKey="totalWatts" stroke="#00aaff" fill="rgba(0,170,255,0.25)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
                {tab === 'peaks' && (
                    <>
                        <div className="role-grid">
                            <div className="role-stat"><span className="role-stat-l">Max Peak (30d)</span><span className="role-stat-v">{fmt(GRID_DATA.peaks.maxPeak)} W</span></div>
                        </div>
                        <div className="role-card">
                            <div className="role-card-head"><span className="role-card-title">Daily peak · last 30 days</span></div>
                            <div className="role-chart">
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={GRID_DATA.peaks.peakHistory}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                        <Line type="monotone" dataKey="peakWatts" stroke="#00aaff" strokeWidth={2} dot={{ fill: '#00aaff', r: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
                {tab === 'load' && (
                    <div className="role-card">
                        <div className="role-card-head"><span className="role-card-title">Load by State</span></div>
                        <div className="role-chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={GRID_DATA.load.areas} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="state" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} width={80} />
                                    <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                                    <Bar dataKey="totalLoadWatts" fill="#00aaff" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="role-table-wrap" style={{ marginTop: '1.5rem' }}>
                            <table className="role-table">
                                <thead><tr><th>State</th><th>Total Load (W)</th><th>Active Meters</th><th>Avg/Meter</th></tr></thead>
                                <tbody>{GRID_DATA.load.areas.map(a => (
                                    <tr key={a.state}><td>{a.state}</td><td>{fmt(a.totalLoadWatts)}</td><td>{fmt(a.activeMeters)}</td><td>{a.avgPerMeter?.toFixed(1)}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Main Preview with Role Switcher ──
const ROLES = [
    { id: 'discom', label: 'DISCOM' },
    { id: 'government', label: 'Government' },
    { id: 'grid', label: 'Grid Operator' },
];

function RoleSwitcher({ role, setRole }) {
    return (
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '.65rem', letterSpacing: '2px', marginRight: '.5rem', alignSelf: 'center', fontFamily: "'DM Mono', monospace" }}>SWITCH</span>
            {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)} style={{
                    padding: '.3rem .8rem', borderRadius: 3, cursor: 'pointer', fontSize: '.65rem',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    border: role === r.id ? '1px solid #0047AB' : '1px solid rgba(255,255,255,0.12)',
                    background: role === r.id ? 'rgba(0,71,171,0.2)' : 'transparent',
                    color: role === r.id ? '#4d9fff' : 'rgba(255,255,255,0.5)',
                    fontFamily: "'DM Mono', monospace",
                }}>{r.label}</button>
            ))}
        </div>
    );
}

export default function RolePreview() {
    const [role, setRole] = useState('discom');
    const switcher = <RoleSwitcher role={role} setRole={setRole} />;
    return (
        <>
            {role === 'discom' && <DiscomPreview switcher={switcher} />}
            {role === 'government' && <GovernmentPreview switcher={switcher} />}
            {role === 'grid' && <GridPreview switcher={switcher} />}
        </>
    );
}
