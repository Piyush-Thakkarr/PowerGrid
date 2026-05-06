import React, { useState } from 'react';
import { LayoutDashboard, Users, TrendingUp, Receipt, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import RoleSidebar from '../components/dashboard/RoleSidebar';
import { useAuth } from '../context/AuthContext';
import {
    useDiscomOverview,
    useDiscomSegmentation,
    useDiscomDemand,
    useDiscomConsumers,
    useDiscomRevenue,
} from '../hooks/useDiscom';

const TABS = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'segmentation', label: 'Segmentation', Icon: BarChart3 },
    { id: 'demand', label: 'Demand', Icon: TrendingUp },
    { id: 'consumers', label: 'Consumers', Icon: Users },
    { id: 'revenue', label: 'Revenue', Icon: Receipt },
];

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

function Loading() { return <div className="role-loading">Loading…</div>; }
function ErrorBox({ msg }) { return <div className="role-error">⚠ {msg}</div>; }

function OverviewTab({ mock }) {
    const { data: fetched, loading, error } = useDiscomOverview({ skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const k = data || {};
    return (
        <div className="role-grid">
            <div className="role-stat"><span className="role-stat-l">Consumers</span><span className="role-stat-v">{fmt(k.totalConsumers)}</span></div>
            <div className="role-stat"><span className="role-stat-l">Total kWh (30d)</span><span className="role-stat-v">{fmt(k.totalKwh30d)}</span></div>
            <div className="role-stat"><span className="role-stat-l">Avg Load (W)</span><span className="role-stat-v">{fmt(k.avgLoadWatts)}</span></div>
            <div className="role-stat"><span className="role-stat-l">Peak Load (W)</span><span className="role-stat-v">{fmt(k.peakLoadWatts)}</span></div>
            <div className="role-stat role-stat-wide"><span className="role-stat-l">State</span><span className="role-stat-v">{k.state || '—'}</span></div>
        </div>
    );
}

function SegmentationTab({ mock }) {
    const { data: fetched, loading, error } = useDiscomSegmentation(3, { skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const clusters = data?.clusters || [];
    return (
        <div className="role-stack">
            {clusters.map(c => (
                <div key={c.clusterId} className="role-card">
                    <div className="role-card-head">
                        <span className="role-card-title">Cluster #{c.clusterId}</span>
                        <span className="role-card-meta">{fmt(c.userCount)} users · peak {c.peakHour}h · {c.dailyAvgKwh?.toFixed(2)} kWh/day avg</span>
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

function DemandTab({ mock }) {
    const { data: fetched, loading, error } = useDiscomDemand(7, { skip: !!mock });
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
                <div className="role-card-head"><span className="role-card-title">24h Demand Curve · last 7 days avg</span></div>
                <div className="role-chart">
                    <ResponsiveContainer width="100%" height={260}>
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

function ConsumersTab({ mock }) {
    const [page, setPage] = useState(1);
    const { data: fetched, loading, error } = useDiscomConsumers(page, 25, { skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const rows = data?.consumers || [];
    return (
        <div className="role-card">
            <div className="role-card-head">
                <span className="role-card-title">Consumers</span>
                <span className="role-card-meta">Page {data?.page} / {data?.totalPages} · {fmt(data?.total)} total</span>
            </div>
            <div className="role-table-wrap">
                <table className="role-table">
                    <thead><tr><th>Email</th><th>State</th><th>Monthly kWh</th><th>Avg Watts</th></tr></thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.userId}>
                                <td>{r.email}</td>
                                <td>{r.state}</td>
                                <td>{r.monthlyKwh?.toFixed(1)}</td>
                                <td>{fmt(r.avgWatts)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="role-pager">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page}</span>
                <button disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
        </div>
    );
}

function RevenueTab({ mock }) {
    const { data: fetched, loading, error } = useDiscomRevenue({ skip: !!mock });
    const data = mock || fetched;
    if (!mock && loading) return <Loading />;
    if (!mock && error) return <ErrorBox msg={error} />;
    const byPlan = data?.byPlan || [];
    return (
        <div className="role-card">
            <div className="role-card-head"><span className="role-card-title">Revenue by Plan</span></div>
            <div className="role-chart">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byPlan}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="plan" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,170,255,0.3)' }} />
                        <Bar dataKey="totalKwh" fill="#00aaff" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function DiscomDashboard({ mocks, user: userProp }) {
    const { user: authUser } = useAuth();
    const user = userProp || authUser;
    const [tab, setTab] = useState('overview');

    return (
        <div className="dash-page">
            <RoleSidebar tabs={TABS} tab={tab} onTabChange={setTab} user={user} title="DISCOM" />
            <main className="dash-main">
                <header className="role-header">
                    <span className="role-header-tag">DISCOM Dashboard</span>
                    <h1 className="role-header-title">{TABS.find(t => t.id === tab)?.label}</h1>
                </header>
                {tab === 'overview' && <OverviewTab mock={mocks?.overview} />}
                {tab === 'segmentation' && <SegmentationTab mock={mocks?.segmentation} />}
                {tab === 'demand' && <DemandTab mock={mocks?.demand} />}
                {tab === 'consumers' && <ConsumersTab mock={mocks?.consumers} />}
                {tab === 'revenue' && <RevenueTab mock={mocks?.revenue} />}
            </main>
        </div>
    );
}
