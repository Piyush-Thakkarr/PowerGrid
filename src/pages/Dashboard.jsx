import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useChartData } from '../hooks/useChartData';
import { DASHBOARD_TABS } from '../lib/constants';
import { API_BASE } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/dashboard/Sidebar';
import OverviewTab from '../components/dashboard/tabs/OverviewTab';
import AnalyticsTab from '../components/dashboard/tabs/AnalyticsTab';
import BillingTab from '../components/dashboard/tabs/BillingTab';
import CompareTab from '../components/dashboard/tabs/CompareTab';
import RewardsTab from '../components/dashboard/tabs/RewardsTab';
import ProfileTab from '../components/dashboard/tabs/ProfileTab';
import MLTab from '../components/dashboard/tabs/MLTab';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [overviewChartView, setOverviewChartView] = useState('monthly');
    const [analyticsChartView, setAnalyticsChartView] = useState('monthly');
    const [liveWatts, setLiveWatts] = useState(0);
    const [loggingOut, setLoggingOut] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const wsRef = useRef(null);

    // Single API call for all dashboard data
    const { data: dashData, loading: dashLoading, error: dashError } = useDashboardData();

    // Only fetch chart data separately when user switches away from monthly (which we already have)
    const overviewChart = useChartData(overviewChartView === 'monthly' ? null : overviewChartView);
    const analyticsChart = useChartData(analyticsChartView === 'monthly' ? null : analyticsChartView);

    // Map pre-fetched monthly data to chart format
    const monthlyChartData = useMemo(() => {
        if (!dashData?.monthly) return [];
        return dashData.monthly.map(r => ({
            month: MONTH_NAMES[parseInt(r.month.split('-')[1]) - 1],
            units: Math.round(r.kwh * 100) / 100,
        }));
    }, [dashData?.monthly]);

    const hourlyChartData = useMemo(() => {
        if (!dashData?.hourly) return [];
        return dashData.hourly.map(r => ({
            time: new Date(r.hour).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            units: Math.round(r.kwh * 100) / 100,
        }));
    }, [dashData?.hourly]);

    // Pick chart data: use pre-fetched if available, else use separate fetch
    const getChartProps = (view, separateChart) => {
        if (view === 'monthly' && monthlyChartData.length > 0) {
            return { data: monthlyChartData, chartKey: 'month', loading: dashLoading };
        }
        if (view === 'hourly' && hourlyChartData.length > 0 && !separateChart.data?.length) {
            return { data: hourlyChartData, chartKey: 'time', loading: dashLoading };
        }
        return { data: separateChart.data, chartKey: separateChart.chartKey, loading: separateChart.loading };
    };

    const ovChartProps = getChartProps(overviewChartView, overviewChart);
    const anChartProps = getChartProps(analyticsChartView, analyticsChart);

    // WebSocket for live watts
    useEffect(() => {
        if (!user?.id) return;
        // Simulated live watts (WS not supported on serverless)
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
        try {
            await Promise.race([logout(), new Promise(resolve => setTimeout(resolve, 2000))]);
        } catch { /* timeout fallback */ }
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        navigate('/', { replace: true });
    };

    // Extract data from the single API response
    const stats = dashData?.stats || {};
    const thisMonthUnits = stats.thisMonthKwh || 0;
    const todayUnits = stats.todayKwh || 0;
    const monthChange = stats.monthChangePercent || 0;
    const xpData = dashData?.xp || { xp: 0, level: 1 };
    const billing = { bill: dashData?.billing || null, history: dashData?.billHistory || [] };
    const comparison = { data: dashData?.comparison || null };
    const gamification = {
        xp: xpData,
        achievements: dashData?.achievements || { achievements: [], totalUnlocked: 0, totalAvailable: 0 },
        challenges: dashData?.challenges || [],
        leaderboard: dashData?.leaderboard || [],
    };

    return (
        <div className="dash-page">
            <Sidebar tab={tab} onTabChange={setTab} user={user} level={xpData.level} onLogout={handleLogout} loggingOut={loggingOut} />
            <main className="dash-content">
                {!bannerDismissed && user?.provider === 'google' && user?.state === 'Gujarat' && user?.householdSize === 4 && tab !== 'profile' && (
                    <div className="dash-setup-banner" role="button" tabIndex={0} onClick={() => setTab('profile')} onKeyDown={e => e.key === 'Enter' && setTab('profile')}>
                        <span>⚡</span> Complete your profile for accurate billing &amp; comparison data <span className="dash-setup-link">Set up →</span>
                        <button className="dash-setup-dismiss" onClick={e => { e.stopPropagation(); setBannerDismissed(true); }} aria-label="Dismiss">✕</button>
                    </div>
                )}
                {dashLoading && <div className="dash-loading">Loading dashboard data...</div>}
                {dashError && <div className="dash-error">Error loading data: {dashError}</div>}
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="dash-content-inner">
                        {tab === 'overview' && <OverviewTab liveWatts={liveWatts} todayUnits={todayUnits} thisMonthUnits={thisMonthUnits} monthChange={monthChange} bill={billing.bill} gamification={xpData} chartData={ovChartProps.data} chartKey={ovChartProps.chartKey} chartView={overviewChartView} setChartView={setOverviewChartView} loading={ovChartProps.loading} />}
                        {tab === 'analytics' && <AnalyticsTab chartView={analyticsChartView} setChartView={setAnalyticsChartView} chartData={anChartProps.data} chartKey={anChartProps.chartKey} loading={anChartProps.loading} heatmapData={dashData?.heatmap} />}
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
                    <button key={t.id} className={`dash-mobile-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        <span className="dash-mobile-tab-icon">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
                <button className="dash-mobile-tab" onClick={handleLogout} disabled={loggingOut}>
                    <span className="dash-mobile-tab-icon">{loggingOut ? '...' : '🚪'}</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
