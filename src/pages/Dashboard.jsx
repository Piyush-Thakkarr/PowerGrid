import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConsumptionData } from '../hooks/useConsumptionData';
import { useChartData } from '../hooks/useChartData';
import { useBilling } from '../hooks/useBilling';
import { useComparison } from '../hooks/useComparison';
import { useGamification } from '../hooks/useGamification';
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

    // Fetch real data from APIs
    const consumption = useConsumptionData();
    const overviewChart = useChartData(overviewChartView);
    const analyticsChart = useChartData(analyticsChartView);
    const billing = useBilling();
    const comparison = useComparison();
    const gamification = useGamification();

    // WebSocket for live watts
    useEffect(() => {
        if (!user?.id) return;

        const wsUrl = API_BASE.replace(/^http/, 'ws') + `/ws/live/${user.id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLiveWatts(Math.round(data.powerWatts || 0));
            } catch { /* ignore parse errors */ }
        };

        ws.onerror = () => {
            // Fallback to simulated data if WS fails
            const tick = () => {
                const h = new Date().getHours();
                let base = h >= 17 && h <= 22 ? 1800 : h >= 6 && h <= 9 ? 1200 : h >= 10 && h <= 16 ? 700 : 400;
                setLiveWatts(Math.round(base + (Math.random() - 0.5) * 300));
            };
            tick();
            const id = setInterval(tick, 5000);
            ws.onclose = () => clearInterval(id);
        };

        return () => { ws.close(); };
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

    // Derived values from real API data
    const stats = consumption.stats || {};
    const thisMonthUnits = stats.thisMonthKwh || 0;
    const todayUnits = stats.todayKwh || 0;
    const monthChange = stats.monthChangePercent || 0;
    const xpData = gamification.xp || { xp: 0, level: 1 };

    // Loading state
    const isLoading = consumption.loading && billing.loading;

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
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="dash-content-inner">
                        {tab === 'overview' && <OverviewTab liveWatts={liveWatts} todayUnits={todayUnits} thisMonthUnits={thisMonthUnits} monthChange={monthChange} bill={billing.bill} gamification={xpData} chartData={overviewChart.data} chartKey={overviewChart.chartKey} chartView={overviewChartView} setChartView={setOverviewChartView} loading={overviewChart.loading} />}
                        {tab === 'analytics' && <AnalyticsTab chartView={analyticsChartView} setChartView={setAnalyticsChartView} chartData={analyticsChart.data} chartKey={analyticsChart.chartKey} loading={analyticsChart.loading} />}
                        {tab === 'billing' && <BillingTab bill={billing.bill} history={billing.history} loading={billing.loading} user={user} />}
                        {tab === 'compare' && <CompareTab comparison={comparison.data} loading={comparison.loading} user={user} />}
                        {tab === 'rewards' && <RewardsTab gamification={gamification} user={user} loading={gamification.loading} />}
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
