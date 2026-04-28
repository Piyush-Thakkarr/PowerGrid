import '../styles/dashboard.css';
import React, { useState } from 'react';
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

const mockUser = { id: '1', name: 'Piyush Thakkar', email: 'piyush.thakkar054@gmail.com', state: 'Maharashtra', householdSize: 4, tariffPlan: 'Residential', xp: 850, level: 5, createdAt: '2026-03-15' };
const mockBill = { totalCost: 632, totalUnits: 108, energyCharge: 509, fixedCharge: 50, electricityDuty: 81, fuelSurcharge: 36, discom: 'MSEDCL', breakdown: [{ slabStart: 0, slabEnd: 100, units: 100, rate: 4.71, cost: 471 }, { slabStart: 100, slabEnd: 300, units: 8, rate: 10.29, cost: 82.32 }] };
const mockHistory = [{ month: '2025-09', totalUnits: 28 }, { month: '2025-10', totalUnits: 325 }, { month: '2025-11', totalUnits: 598 }, { month: '2025-12', totalUnits: 462 }, { month: '2026-01', totalUnits: 285 }, { month: '2026-02', totalUnits: 170 }];
const mockChart = [{ month: 'Sep', units: 28 }, { month: 'Oct', units: 325 }, { month: 'Nov', units: 598 }, { month: 'Dec', units: 462 }, { month: 'Jan', units: 285 }, { month: 'Feb', units: 170 }, { month: 'Mar', units: 108 }];
const mockComparison = { yourMonthlyKwh: 108, stateAvgKwh: 95, similarHouseholdKwh: 88, nationalAvgKwh: 120, yourRank: 3, totalUsers: 10, percentile: 30 };
const mockXp = { xp: 850, level: 5, progress: 85, xpToNextLevel: 150 };
const mockGamification = {
    xp: mockXp,
    achievements: { achievements: [
        { id: 'first_login', name: 'First Steps', description: 'First login', icon: '1', unlocked: true },
        { id: 'week_streak', name: 'Week Warrior', description: '7-day streak', icon: '7', unlocked: true },
        { id: 'saver', name: 'Energy Saver', description: 'Reduced 10%', icon: 'S', unlocked: true },
        { id: 'nerd', name: 'Data Nerd', description: 'Viewed analytics 10x', icon: 'D', unlocked: false },
    ], totalUnlocked: 3, totalAvailable: 4 },
    challenges: [
        { id: 1, name: 'March Saver', description: 'Use under 150 kWh', target: 150, progress: 108, unit: 'kWh' },
        { id: 2, name: 'Peak Shifter', description: 'Reduce peak by 20%', target: 20, progress: 12, unit: '%' },
    ],
    leaderboard: [
        { rank: 1, name: 'Amit Sharma', state: 'Delhi', points: 1200, savingsPercent: 24 },
        { rank: 2, name: 'Priya Patel', state: 'Gujarat', points: 1050, savingsPercent: 19 },
        { rank: 3, name: 'Piyush Thakkar', state: 'Maharashtra', points: 850, savingsPercent: 15, userId: '1' },
    ],
};

export default function DashboardPreview() {
    const [tab, setTab] = useState('overview');
    return (
        <div className="dash-page">
            <Sidebar tab={tab} onTabChange={setTab} user={mockUser} onLogout={() => window.location.href = '/'} />
            <main className="dash-main">
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        {tab === 'overview' && <OverviewTab liveWatts={726} todayUnits={4.2} thisMonthUnits={108} monthChange={29} peakWatts={1842} bill={mockBill} gamification={mockXp} comparison={mockComparison} hourlyData={[]} chartData={mockChart} chartKey="month" chartView="monthly" setChartView={() => {}} loading={false} />}
                        {tab === 'analytics' && <AnalyticsTab chartData={mockChart} chartKey="month" loading={false} />}
                        {tab === 'billing' && <BillingTab bill={mockBill} history={mockHistory} loading={false} user={mockUser} />}
                        {tab === 'compare' && <CompareTab comparison={mockComparison} loading={false} user={mockUser} />}
                        {tab === 'rewards' && <RewardsTab gamification={mockGamification} user={mockUser} loading={false} />}
                        {tab === 'profile' && <ProfileTab user={mockUser} gamification={mockXp} />}
                        {tab === 'ml' && <MLTab />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
