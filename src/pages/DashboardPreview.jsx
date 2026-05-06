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
import ApplianceTab from '../components/dashboard/tabs/ApplianceTab';
import ForecastTab from '../components/dashboard/tabs/ForecastTab';
import AnomaliesTab from '../components/dashboard/tabs/AnomaliesTab';
import TariffTab from '../components/dashboard/tabs/TariffTab';
import DemandResponseTab from '../components/dashboard/tabs/DemandResponseTab';
import SegmentationTab from '../components/dashboard/tabs/SegmentationTab';
import DiscomDashboard from './DiscomDashboard';
import GovernmentDashboard from './GovernmentDashboard';
import GridDashboard from './GridDashboard';
import { MOCK_USERS, DISCOM_MOCKS, GOV_MOCKS, GRID_MOCKS } from '../lib/previewMocks';

// ── Mocks for the consumer dashboard's existing tabs ─────────────
const mockBill = { totalCost: 632, totalUnits: 108, energyCharge: 509, fixedCharge: 50, electricityDuty: 81, fuelSurcharge: 36, discom: 'MSEDCL', breakdown: [{ slabStart: 0, slabEnd: 100, units: 100, rate: 4.71, cost: 471 }, { slabStart: 100, slabEnd: 300, units: 8, rate: 10.29, cost: 82.32 }] };
const mockHistory = [{ month: '2025-09', totalUnits: 28 }, { month: '2025-10', totalUnits: 325 }, { month: '2025-11', totalUnits: 598 }, { month: '2025-12', totalUnits: 462 }, { month: '2026-01', totalUnits: 285 }, { month: '2026-02', totalUnits: 170 }];
const mockChart = [{ month: 'Sep', units: 28 }, { month: 'Oct', units: 325 }, { month: 'Nov', units: 598 }, { month: 'Dec', units: 462 }, { month: 'Jan', units: 285 }, { month: 'Feb', units: 170 }, { month: 'Mar', units: 108 }];
const mockComparison = { yourMonthlyKwh: 108, stateAvgKwh: 95, similarHouseholdKwh: 88, nationalAvgKwh: 120, yourRank: 3, totalUsers: 10, percentile: 30 };
const mockXp = { xp: 850, level: 5, progress: 85, xpToNextLevel: 150 };
const mockGamification = {
    xp: mockXp,
    achievements: {
        achievements: [
            { id: 'first_login', name: 'First Steps', description: 'First login', icon: '1', unlocked: true },
            { id: 'week_streak', name: 'Week Warrior', description: '7-day streak', icon: '7', unlocked: true },
            { id: 'saver', name: 'Energy Saver', description: 'Reduced 10%', icon: 'S', unlocked: true },
            { id: 'nerd', name: 'Data Nerd', description: 'Viewed analytics 10x', icon: 'D', unlocked: false },
        ], totalUnlocked: 3, totalAvailable: 4
    },
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

const mockAppliance = {
    totalKwh: 108.4, dataPoints: 2880,
    breakdown: [
        { appliance: 'EV Charger', estimatedKwh: 34.6, percentage: 31.9 },
        { appliance: 'AC / Heating', estimatedKwh: 28.8, percentage: 26.6 },
        { appliance: 'Kitchen', estimatedKwh: 16.2, percentage: 14.9 },
        { appliance: 'Lighting', estimatedKwh: 12.4, percentage: 11.4 },
        { appliance: 'Water Heating', estimatedKwh: 9.8, percentage: 9.0 },
        { appliance: 'Other', estimatedKwh: 6.6, percentage: 6.2 },
    ],
    nmfComponents: [
        { componentId: 1, peakHour: 19, hourlyProfile: [12, 8, 6, 5, 5, 7, 14, 22, 28, 24, 18, 16, 18, 20, 22, 26, 32, 45, 58, 62, 48, 36, 24, 16] },
        { componentId: 2, peakHour: 8, hourlyProfile: [8, 6, 5, 4, 4, 8, 18, 38, 52, 40, 22, 15, 12, 14, 16, 18, 22, 28, 30, 26, 20, 16, 12, 10] },
    ],
};

const mockForecast = {
    model: 'extra_trees',
    predictions: Array.from({ length: 7 }).map((_, i) => ({
        date: `2026-05-${String(7 + i).padStart(2, '0')}`,
        predicted: Number((3.4 + Math.sin(i / 1.5) * 0.6 + Math.random() * 0.3).toFixed(2)),
    })),
    topFeatures: [
        { name: 'lag_1d_kwh', importance: 0.347 },
        { name: 'rolling_7d_avg', importance: 0.218 },
        { name: 'day_of_week', importance: 0.165 },
        { name: 'temp_max', importance: 0.124 },
        { name: 'is_weekend', importance: 0.087 },
        { name: 'lag_7d_kwh', importance: 0.059 },
    ],
};

const mockAnomalies = {
    anomalyCount: 3, totalDays: 60,
    anomalies: [
        { date: '2026-04-22', actual: 6.8, expected: 3.4, deviationPercent: 100.0, zScore: 3.42, severity: 'high' },
        { date: '2026-04-15', actual: 5.2, expected: 3.6, deviationPercent: 44.4, zScore: 2.18, severity: 'medium' },
        { date: '2026-04-08', actual: 4.8, expected: 3.7, deviationPercent: 29.7, zScore: 2.04, severity: 'low' },
    ],
    decomposition: {
        dates: Array.from({ length: 30 }).map((_, i) => `2026-04-${String(i + 1).padStart(2, '0')}`),
        observed: Array.from({ length: 30 }).map((_, i) => 3.5 + Math.sin(i / 4) + Math.random() * 0.4),
        trend: Array.from({ length: 30 }).map((_, i) => 3.5 + i * 0.01),
        seasonal: Array.from({ length: 30 }).map((_, i) => Math.sin(i / 4)),
        residual: Array.from({ length: 30 }).map(() => (Math.random() - 0.5) * 0.6),
    },
};

const mockTariff = {
    currentPlan: 'Residential', recommendedPlan: 'TOU-Residential', monthlySavings: 184,
    monthlyKwh: 108.4, peakUsagePercent: 38.2, discom: 'MSEDCL', state: 'Maharashtra',
    allPlans: [
        { plan: 'Residential', totalBill: 632, energyCharge: 509, fixedCharge: 50, duty: 81, fuelSurcharge: 36 },
        { plan: 'TOU-Residential', totalBill: 448, energyCharge: 351, fixedCharge: 50, duty: 60, fuelSurcharge: 27 },
        { plan: 'Solar-Net', totalBill: 512, energyCharge: 410, fixedCharge: 50, duty: 65, fuelSurcharge: 28 },
        { plan: 'EV-Tariff', totalBill: 489, energyCharge: 388, fixedCharge: 60, duty: 62, fuelSurcharge: 30 },
    ],
};

const mockDemand = {
    threshold: 1.85, predictedPeakCount: 5,
    recommendation: 'Shift your EV charging and washer to between 11 PM and 5 AM tonight — 5 peak hours predicted, mostly between 6 PM and 10 PM.',
    predictions: Array.from({ length: 24 }).map((_, h) => {
        const isPeak = (h >= 18 && h <= 22);
        return { hour: h, isPeak, peakProbability: isPeak ? 0.65 + Math.random() * 0.3 : Math.random() * 0.35 };
    }),
};

const mockSegment = { clusterId: 4, clusterSize: 1842, peakHour: 19, clusterDailyAvg: 3.62 };

const ROLES = [
    { id: 'consumer', label: 'Consumer' },
    { id: 'discom', label: 'DISCOM' },
    { id: 'government', label: 'Government' },
    { id: 'grid_operator', label: 'Grid Operator' },
];

function ConsumerPreview() {
    const [tab, setTab] = useState('overview');
    return (
        <div className="dash-page">
            <Sidebar tab={tab} onTabChange={setTab} user={MOCK_USERS.consumer} onLogout={() => window.location.href = '/'} />
            <main className="dash-main">
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        {tab === 'overview' && <OverviewTab liveWatts={726} todayUnits={4.2} thisMonthUnits={108} monthChange={29} peakWatts={1842} bill={mockBill} gamification={mockXp} comparison={mockComparison} hourlyData={[]} chartData={mockChart} chartKey="month" chartView="monthly" setChartView={() => { }} loading={false} />}
                        {tab === 'analytics' && <AnalyticsTab chartData={mockChart} chartKey="month" loading={false} />}
                        {tab === 'appliance' && <ApplianceTab mock={mockAppliance} />}
                        {tab === 'forecast' && <ForecastTab mock={mockForecast} />}
                        {tab === 'anomalies' && <AnomaliesTab mock={mockAnomalies} />}
                        {tab === 'tariff' && <TariffTab mock={mockTariff} />}
                        {tab === 'demand' && <DemandResponseTab mock={mockDemand} />}
                        {tab === 'segment' && <SegmentationTab mock={mockSegment} />}
                        {tab === 'billing' && <BillingTab bill={mockBill} history={mockHistory} loading={false} user={MOCK_USERS.consumer} />}
                        {tab === 'compare' && <CompareTab comparison={mockComparison} loading={false} user={MOCK_USERS.consumer} />}
                        {tab === 'rewards' && <RewardsTab gamification={mockGamification} user={MOCK_USERS.consumer} loading={false} />}
                        {tab === 'profile' && <ProfileTab user={MOCK_USERS.consumer} gamification={mockXp} />}
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

export default function DashboardPreview() {
    const [role, setRole] = useState('consumer');

    return (
        <>
            <div className="preview-switch">
                <span className="preview-switch-tag">Preview</span>
                <div className="preview-switch-tabs">
                    {ROLES.map(r => (
                        <button
                            key={r.id}
                            className={`preview-switch-btn${role === r.id ? ' on' : ''}`}
                            onClick={() => setRole(r.id)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {role === 'consumer' && <ConsumerPreview />}
            {role === 'discom' && <DiscomDashboard mocks={DISCOM_MOCKS} user={MOCK_USERS.discom} />}
            {role === 'government' && <GovernmentDashboard mocks={GOV_MOCKS} user={MOCK_USERS.government} />}
            {role === 'grid_operator' && <GridDashboard mocks={GRID_MOCKS} user={MOCK_USERS.grid_operator} />}
        </>
    );
}
