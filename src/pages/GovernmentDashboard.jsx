import React, { useState } from 'react';
import { Map, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import RoleSidebar from '../components/dashboard/RoleSidebar';
import { useAuth } from '../context/AuthContext';
import {
    useGovOverview,
    useGovSegmentation,
    useGovTariffDistribution,
    useGovConsumptionTrend,
} from '../hooks/useGovernment';

const TABS = [
    { id: 'states', label: 'States', Icon: Map },
    { id: 'segmentation', label: 'Segmentation', Icon: BarChart3 },
    { id: 'tariff', label: 'Tariff Adoption', Icon: PieIcon },
    { id: 'trend', label: 'Consumption Trend', Icon: TrendingUp },
];

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

function Loading() { return <div className="role-loading">Loading…</div>; }
function ErrorBox({ msg }) { return <div className="role-error">⚠ {msg}</div>; }

function StatesTab() {
    const { data, loading, error } = useGovOverview();
    if (loading) return <Loading />;
    if (error) return <ErrorBox msg={error} />;
    const rows = data?.byState || [];
    return (
        <>
            <div className="role-grid">
                <div className="role-stat"><span className="role-stat-l">States</span><span className="role-stat-v">{fmt(data?.totalStates)}</span></div>
                <div className="role-stat"><span className="role-stat-l">Consumers</span><span className="role-stat-v">{fmt(data?.totalConsumers)}</span></div>
                <div className="role-stat"><span className="role-stat-l">Total kWh</span><span className="role-stat-v">{fmt(data?.totalKwh)}</span></div>
            </div>
            <div className="role-card">
                <div className="role-card-head"><span className="role-card-title">Consumption by State</span></div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={rows} layout="vertical" margin={{ left: 80 }}>
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
    );
}

function SegmentationTab() {
    const { data, loading, error } = useGovSegmentation(3);
    if (loading) return <Loading />;
    if (error) return <ErrorBox msg={error} />;
    const clusters = data?.clusters || [];
    return (
        <div className="role-stack">
            {clusters.map(c => (
                <div key={c.clusterId} className="role-card">
                    <div className="role-card-head">
                        <span className="role-card-title">Cluster #{c.clusterId}</span>
                        <span className="role-card-meta">{fmt(c.userCount)} users · peak {c.peakHour}h · {c.dailyAvgKwh?.toFixed(2)} kWh/day</span>
                    </div>
                    <div className="role-chart">
                        <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={(c.hourlyProfile || []).map((v, i) => ({ hour: i, kwh: v }))}>
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
    );
}

function TariffTab() {
    const { data, loading, error } = useGovTariffDistribution();
    if (loading) return <Loading />;
    if (error) return <ErrorBox msg={error} />;
    const rows = data?.distribution || [];
    return (
        <div className="role-card">
            <div className="role-card-head"><span className="role-card-title">Tariff Adoption · State × Plan</span></div>
            <div className="role-table-wrap">
                <table className="role-table">
                    <thead><tr><th>State</th><th>Plan</th><th>Users</th></tr></thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={`${r.state}-${r.plan}-${i}`}><td>{r.state}</td><td>{r.plan}</td><td>{fmt(r.userCount)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TrendTab() {
    const { data, loading, error } = useGovConsumptionTrend(6);
    if (loading) return <Loading />;
    if (error) return <ErrorBox msg={error} />;
    const trend = data?.trend || [];
    return (
        <div className="role-card">
            <div className="role-card-head"><span className="role-card-title">National Consumption · last 6 months</span></div>
            <div className="role-chart">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trend}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                        <Line type="monotone" dataKey="totalKwh" stroke="#00aaff" strokeWidth={2} dot={{ fill: '#00aaff', r: 3 }} />
                        <Line type="monotone" dataKey="activeUsers" stroke="#82C8E5" strokeWidth={2} dot={{ fill: '#82C8E5', r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function GovernmentDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('states');

    return (
        <div className="dash-page">
            <RoleSidebar tabs={TABS} tab={tab} onTabChange={setTab} user={user} title="Government" />
            <main className="dash-main">
                <header className="role-header">
                    <span className="role-header-tag">Government Dashboard</span>
                    <h1 className="role-header-title">{TABS.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'states' && <StatesTab />}
                {tab === 'segmentation' && <SegmentationTab />}
                {tab === 'tariff' && <TariffTab />}
                {tab === 'trend' && <TrendTab />}
            </main>
        </div>
    );
}
