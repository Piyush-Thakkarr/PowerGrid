import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateConsumptionData, calculateBill, generateComparisonData, generateGamificationData } from '../lib/demoData';
import { DASHBOARD_TABS } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/dashboard/Sidebar';
import OverviewTab from '../components/dashboard/tabs/OverviewTab';
import AnalyticsTab from '../components/dashboard/tabs/AnalyticsTab';
import BillingTab from '../components/dashboard/tabs/BillingTab';
import CompareTab from '../components/dashboard/tabs/CompareTab';
import RewardsTab from '../components/dashboard/tabs/RewardsTab';
import ProfileTab from '../components/dashboard/tabs/ProfileTab';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [overviewChartView, setOverviewChartView] = useState('hourly');
    const [analyticsChartView, setAnalyticsChartView] = useState('hourly');
    const [liveWatts, setLiveWatts] = useState(0);
    const [loggingOut, setLoggingOut] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const data = useMemo(() => generateConsumptionData(user?.id), [user?.id]);
    const thisMonthUnits = data.monthly[data.monthly.length - 1]?.units || 0;
    const comparison = useMemo(() => generateComparisonData(user?.id, user?.householdSize, user?.state, thisMonthUnits), [user?.id, user?.householdSize, user?.state, thisMonthUnits]);
    const gamification = useMemo(() => generateGamificationData(user?.id), [user?.id]);

    const todayUnits = data.hourly.reduce((s, h) => s + h.units, 0);
    const lastMonthUnits = data.monthly[data.monthly.length - 2]?.units || 0;
    const monthChange = lastMonthUnits > 0 ? Math.round((thisMonthUnits - lastMonthUnits) / lastMonthUnits * 100) : 0;
    const bill = calculateBill(thisMonthUnits);

    useEffect(() => {
        const tick = () => {
            const h = new Date().getHours();
            let base = 400;
            if (h >= 6 && h <= 9) base = 1200;
            else if (h >= 17 && h <= 22) base = 1800;
            else if (h >= 10 && h <= 16) base = 700;
            setLiveWatts(Math.round(base + (Math.random() - 0.5) * 300));
        };
        tick();
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
    }, []);

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

    const getChartData = (view) => view === 'hourly' ? data.hourly : view === 'daily' ? data.daily : data.monthly;
    const getChartKey = (view) => view === 'hourly' ? 'time' : view === 'daily' ? 'day' : 'month';

    return (
        <div className="dash-page">
            <Sidebar tab={tab} onTabChange={setTab} user={user} level={gamification.level} onLogout={handleLogout} loggingOut={loggingOut} />
            <main className="dash-content">
                {!bannerDismissed && user?.provider === 'google' && user?.state === 'Gujarat' && user?.householdSize === 4 && tab !== 'profile' && (
                    <div className="dash-setup-banner" role="button" tabIndex={0} onClick={() => setTab('profile')} onKeyDown={e => e.key === 'Enter' && setTab('profile')}>
                        <span>⚡</span> Complete your profile for accurate billing &amp; comparison data <span className="dash-setup-link">Set up →</span>
                        <button className="dash-setup-dismiss" onClick={e => { e.stopPropagation(); setBannerDismissed(true); }} aria-label="Dismiss">✕</button>
                    </div>
                )}
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="dash-content-inner">
                        {tab === 'overview' && <OverviewTab liveWatts={liveWatts} todayUnits={todayUnits} thisMonthUnits={thisMonthUnits} monthChange={monthChange} bill={bill} gamification={gamification} chartData={getChartData(overviewChartView)} chartKey={getChartKey(overviewChartView)} chartView={overviewChartView} setChartView={setOverviewChartView} />}
                        {tab === 'analytics' && <AnalyticsTab data={data} chartView={analyticsChartView} setChartView={setAnalyticsChartView} chartData={getChartData(analyticsChartView)} chartKey={getChartKey(analyticsChartView)} />}
                        {tab === 'billing' && <BillingTab bill={bill} thisMonthUnits={thisMonthUnits} data={data} user={user} />}
                        {tab === 'compare' && <CompareTab comparison={comparison} user={user} thisMonthUnits={thisMonthUnits} />}
                        {tab === 'rewards' && <RewardsTab gamification={gamification} user={user} />}
                        {tab === 'profile' && <ProfileTab user={user} gamification={gamification} />}
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
