import '../styles/dashboard.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useChartData } from '../hooks/useChartData';
import { DASHBOARD_TABS } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/dashboard/Sidebar';
import OverviewTab from '../components/dashboard/tabs/OverviewTab';
import AnalyticsTab from '../components/dashboard/tabs/AnalyticsTab';
import BillingTab from '../components/dashboard/tabs/BillingTab';
import CompareTab from '../components/dashboard/tabs/CompareTab';
import RewardsTab from '../components/dashboard/tabs/RewardsTab';
import ProfileTab from '../components/dashboard/tabs/ProfileTab';
import MLTab from '../components/dashboard/tabs/MLTab';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [chartView, setChartView] = useState('monthly');
    const [liveWatts, setLiveWatts] = useState(0);
    const [loggingOut, setLoggingOut] = useState(false);

    const { data: dashData, loading: dashLoading, error: dashError } = useDashboardData();
    const extraChart = useChartData(chartView === 'monthly' ? null : chartView);

    const monthlyChart = useMemo(() => {
        if (!dashData?.monthly) return [];
        return dashData.monthly.map(r => ({ month: MONTH_NAMES[parseInt(r.month.split('-')[1]) - 1], units: Math.round(r.kwh * 100) / 100 }));
    }, [dashData?.monthly]);

    const chartProps = chartView === 'monthly' && monthlyChart.length > 0
        ? { data: monthlyChart, chartKey: 'month', loading: dashLoading }
        : { data: extraChart.data, chartKey: extraChart.chartKey, loading: extraChart.loading };

    useEffect(() => {
        if (!user?.id) return;
        const tick = () => {
            const h = new Date().getHours();
            let base = h >= 17 && h <= 22 ? 1800 : h >= 6 && h <= 9 ? 1200 : h >= 10 && h <= 16 ? 700 : 400;
            setLiveWatts(Math.round(base + (Math.random() - 0.5) * 300));
        };
        tick();
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
    }, [user?.id]);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try { await Promise.race([logout(), new Promise(r => setTimeout(r, 2000))]); } catch {}
        Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
        navigate('/', { replace: true });
    };

    const stats = dashData?.stats || {};
    const xpData = dashData?.xp || { xp: 0, level: 1 };
    const billing = { bill: dashData?.billing || null, history: dashData?.billHistory || [] };
    const comparison = { data: dashData?.comparison || null };
    const gamification = { xp: xpData, achievements: dashData?.achievements || { achievements: [], totalUnlocked: 0, totalAvailable: 0 }, challenges: dashData?.challenges || [], leaderboard: dashData?.leaderboard || [] };

    return (
        <div className="dash-page">
            <Sidebar tab={tab} onTabChange={setTab} user={user} />
            <main className="dash-main">
                {dashLoading && <div className="dash-loading">Loading...</div>}
                {dashError && <div className="dash-error">{dashError}</div>}
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        {tab === 'overview' && <OverviewTab liveWatts={liveWatts} todayUnits={stats.todayKwh || 0} thisMonthUnits={stats.thisMonthKwh || 0} monthChange={stats.monthChangePercent || 0} bill={billing.bill} gamification={xpData} chartData={chartProps.data} chartKey={chartProps.chartKey} chartView={chartView} setChartView={setChartView} loading={chartProps.loading} />}
                        {tab === 'analytics' && <AnalyticsTab chartData={chartProps.data} chartKey={chartProps.chartKey} loading={chartProps.loading} />}
                        {tab === 'billing' && <BillingTab bill={billing.bill} history={billing.history} loading={dashLoading} user={user} />}
                        {tab === 'compare' && <CompareTab comparison={comparison.data} loading={dashLoading} user={user} />}
                        {tab === 'rewards' && <RewardsTab gamification={gamification} user={user} loading={dashLoading} />}
                        {tab === 'profile' && <ProfileTab user={user} gamification={xpData} />}
                        {tab === 'ml' && <MLTab />}
                    </motion.div>
                </AnimatePresence>
            </main>
            <div className="dash-mobile-tabs">
                {DASHBOARD_TABS.map(t => (
                    <button key={t.id} className={`dash-mobile-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                        <span className="dash-mobile-tab-icon">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
