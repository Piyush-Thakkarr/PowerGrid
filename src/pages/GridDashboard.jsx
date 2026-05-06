import React from 'react';
import { useState } from 'react';
import { Activity, TrendingUp, Map } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import RoleSidebar from '../components/dashboard/RoleSidebar';
import { useAuth } from '../context/AuthContext';
import {
    useGridDemand,
    useGridPeakHistory,
    useGridLoadDistribution,
} from '../hooks/useGrid';

const TABS = [
    { id: 'demand', label: 'Demand', Icon: Activity },
    { id: 'peaks', label: 'Peak History', Icon: TrendingUp },
    { id: 'load', label: 'Load by State', Icon: Map },
];

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

function Loading() { return <div className="role-loading">Loading…</div>; }
function ErrorBox({ msg }) { return <div className="role-error">⚠ {msg}</div>; }

function DemandTab({ mock }) {
    const { data: fetched, loading, error } = useGridDemand(7, { skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const curve = data?.demandCurve || [];
    return (
        <>
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Peak Demand</span><span className="role-stat-v">{fmt(data?.peakDemand)} W</span></div>
                <div className="role-stat"><span className="role-stat-l">Valley Demand</span><span className="role-stat-v">{fmt(data?.valleyDemand)} W</span></div>
            </div>
            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Grid demand · 24h × last 7 days</span></div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={curve}>
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
    );
}

function PeaksTab({ mock }) {
    const { data: fetched, loading, error } = useGridPeakHistory(30, { skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const peaks = data?.peakHistory || [];
    return (
        <>
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">Max Peak (30d)</span><span className="role-stat-v">{fmt(data?.maxPeak)} W</span></div>
            </div>
            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Daily peak · last 30 days</span></div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={peaks}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                            <Line type="monotone" dataKey="peakWatts" stroke="#00aaff" strokeWidth={2} dot={{ fill: '#00aaff', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

function LoadTab({ mock }) {
    const { data: fetched, loading, error } = useGridLoadDistribution({ skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const areas = data?.areas || [];
    return (
        <div className="role-card">
            <div className="role-card-head"><span className="role-card-title">Load by State</span></div>
            <div className="role-chart">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={areas} layout="vertical" margin={{ left: 80 }}>
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
                    <tbody>
                        {areas.map(a => (
                            <tr key={a.state}>
                                <td>{a.state}</td>
                                <td>{fmt(a.totalLoadWatts)}</td>
                                <td>{fmt(a.activeMeters)}</td>
                                <td>{a.avgPerMeter?.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function GridDashboard({ mocks, user: userProp }) {
    const { user: authUser } = useAuth();
    const user = userProp || authUser;
    const [tab, setTab] = useState('demand');

    return (
        <div className="dash-page">
            <RoleSidebar tabs={TABS} tab={tab} onTabChange={setTab} user={user} title="Grid Operator" />
            <main className="dash-main">
                <header className="role-header">
                    <span className="role-header-tag">Grid Operator Dashboard</span>
                    <h1 className="role-header-title">{TABS.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'demand' && <DemandTab mock={mocks?.demand} />}
                {tab === 'peaks' && <PeaksTab mock={mocks?.peaks} />}
                {tab === 'load' && <LoadTab mock={mocks?.load} />}
            </main>
        </div>
    );
}
