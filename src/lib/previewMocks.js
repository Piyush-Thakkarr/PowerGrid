// Centralized mock data for the public DashboardPreview page.
// Lets us preview all 4 role dashboards without auth or backend.

export const MOCK_USERS = {
    consumer: { id: 'p1', name: 'Archie Tyagi', email: 'archie@gmail.com', state: 'Delhi', householdSize: 4, tariffPlan: 'Residential', xp: 850, level: 5, role: 'consumer' },
    discom: { id: 'd1', name: 'M. Patil', email: 'demo@msedcl.in', state: 'Maharashtra', role: 'discom' },
    government: { id: 'g1', name: 'A. Singh', email: 'demo@powermin.gov.in', state: 'India', role: 'government' },
    grid_operator: { id: 'o1', name: 'R. Iyer', email: 'demo@posoco.in', state: 'India', role: 'grid_operator' },
};

const hourlyShape = (peak = 12) =>
    Array.from({ length: 24 }).map((_, h) => {
        const dist = Math.abs(h - peak);
        return Number((4 - dist * 0.25 + Math.random() * 0.4).toFixed(2));
    });

// ── DISCOM ─────────────────────────────────────────────────────────
export const DISCOM_MOCKS = {
    overview: {
        totalConsumers: 482_650,
        totalKwh30d: 21_846_300,
        avgLoadWatts: 1842,
        peakLoadWatts: 4280,
        state: 'Maharashtra',
    },
    segmentation: {
        clusters: [
            { clusterId: 0, userCount: 184_320, peakHour: 19, dailyAvgKwh: 4.26, hourlyProfile: hourlyShape(19) },
            { clusterId: 1, userCount: 162_840, peakHour: 8, dailyAvgKwh: 3.18, hourlyProfile: hourlyShape(8) },
            { clusterId: 2, userCount: 135_490, peakHour: 14, dailyAvgKwh: 5.74, hourlyProfile: hourlyShape(14) },
        ],
    },
    demand: {
        peakDemand: 4280,
        valleyDemand: 820,
        demandCurve: Array.from({ length: 24 }).map((_, h) => ({
            hour: h,
            totalWatts: Math.round(820 + (1 - Math.cos((h / 24) * Math.PI * 2)) * 1500 + (h >= 18 && h <= 22 ? 1200 : 0)),
            activeUsers: Math.round(280_000 + Math.random() * 80_000),
            avgPerUser: Number((1.5 + Math.random() * 0.6).toFixed(2)),
        })),
    },
    consumers: {
        page: 1,
        totalPages: 19_306,
        total: 482_650,
        consumers: Array.from({ length: 25 }).map((_, i) => ({
            userId: `u${i + 1}`,
            email: `consumer${1000 + i}@msedcl.in`,
            state: 'Maharashtra',
            monthlyKwh: Number((90 + Math.random() * 280).toFixed(1)),
            avgWatts: Math.round(800 + Math.random() * 2400),
        })),
    },
    revenue: {
        byPlan: [
            { plan: 'Residential', userCount: 312_400, totalKwh: 13_280_000 },
            { plan: 'Commercial', userCount: 148_900, totalKwh: 6_740_000 },
            { plan: 'Industrial', userCount: 21_350, totalKwh: 1_826_300 },
        ],
    },
};

// ── Government ─────────────────────────────────────────────────────
export const GOV_MOCKS = {
    states: {
        totalStates: 28,
        totalConsumers: 12_840_650,
        totalKwh: 584_236_400,
        byState: [
            { state: 'Maharashtra', consumers: 1_842_000, totalKwh: 84_120_000 },
            { state: 'Tamil Nadu', consumers: 1_620_000, totalKwh: 71_840_000 },
            { state: 'Gujarat', consumers: 1_438_000, totalKwh: 68_240_000 },
            { state: 'Karnataka', consumers: 1_284_000, totalKwh: 58_320_000 },
            { state: 'Uttar Pradesh', consumers: 1_896_000, totalKwh: 62_180_000 },
            { state: 'West Bengal', consumers: 1_120_000, totalKwh: 48_640_000 },
            { state: 'Delhi', consumers: 826_000, totalKwh: 38_240_000 },
            { state: 'Telangana', consumers: 940_000, totalKwh: 42_180_000 },
            { state: 'Andhra Pradesh', consumers: 1_080_000, totalKwh: 46_780_000 },
            { state: 'Kerala', consumers: 794_000, totalKwh: 32_896_000 },
        ],
    },
    segmentation: DISCOM_MOCKS.segmentation,
    tariff: {
        distribution: [
            { state: 'Maharashtra', plan: 'Residential', userCount: 1_180_000 },
            { state: 'Maharashtra', plan: 'Commercial', userCount: 540_000 },
            { state: 'Maharashtra', plan: 'Industrial', userCount: 122_000 },
            { state: 'Gujarat', plan: 'Residential', userCount: 920_000 },
            { state: 'Gujarat', plan: 'Commercial', userCount: 410_000 },
            { state: 'Gujarat', plan: 'Industrial', userCount: 108_000 },
            { state: 'Karnataka', plan: 'Residential', userCount: 824_000 },
            { state: 'Karnataka', plan: 'Commercial', userCount: 380_000 },
            { state: 'Karnataka', plan: 'Industrial', userCount: 80_000 },
            { state: 'Tamil Nadu', plan: 'Residential', userCount: 1_040_000 },
            { state: 'Tamil Nadu', plan: 'Commercial', userCount: 480_000 },
            { state: 'Tamil Nadu', plan: 'Industrial', userCount: 100_000 },
        ],
    },
    trend: {
        trend: [
            { month: '2025-12', totalKwh: 96_240_000, activeUsers: 12_280_000 },
            { month: '2026-01', totalKwh: 102_840_000, activeUsers: 12_410_000 },
            { month: '2026-02', totalKwh: 88_650_000, activeUsers: 12_520_000 },
            { month: '2026-03', totalKwh: 94_210_000, activeUsers: 12_640_000 },
            { month: '2026-04', totalKwh: 108_320_000, activeUsers: 12_780_000 },
            { month: '2026-05', totalKwh: 121_840_000, activeUsers: 12_840_650 },
        ],
    },
};

// ── Grid Operator ──────────────────────────────────────────────────
export const GRID_MOCKS = {
    demand: {
        peakDemand: 184_280_000,
        valleyDemand: 38_420_000,
        demandCurve: Array.from({ length: 24 }).map((_, h) => ({
            hour: h,
            totalWatts: Math.round(38_000_000 + (1 - Math.cos((h / 24) * Math.PI * 2)) * 70_000_000 + (h >= 18 && h <= 22 ? 60_000_000 : 0)),
            activeUsers: Math.round(11_800_000 + Math.random() * 600_000),
        })),
    },
    peaks: {
        maxPeak: 198_640_000,
        peakHistory: Array.from({ length: 30 }).map((_, i) => ({
            date: `2026-04-${String(i + 1).padStart(2, '0')}`,
            peakWatts: Math.round(170_000_000 + Math.random() * 28_000_000),
            peakHour: 19 + (i % 3),
        })),
    },
    load: {
        areas: [
            { state: 'Maharashtra', totalLoadWatts: 28_640_000, activeMeters: 1_842_000, avgPerMeter: 15.5 },
            { state: 'Tamil Nadu', totalLoadWatts: 24_840_000, activeMeters: 1_620_000, avgPerMeter: 15.3 },
            { state: 'Gujarat', totalLoadWatts: 22_120_000, activeMeters: 1_438_000, avgPerMeter: 15.4 },
            { state: 'Karnataka', totalLoadWatts: 19_840_000, activeMeters: 1_284_000, avgPerMeter: 15.4 },
            { state: 'Uttar Pradesh', totalLoadWatts: 25_780_000, activeMeters: 1_896_000, avgPerMeter: 13.6 },
            { state: 'West Bengal', totalLoadWatts: 16_240_000, activeMeters: 1_120_000, avgPerMeter: 14.5 },
            { state: 'Delhi', totalLoadWatts: 14_240_000, activeMeters: 826_000, avgPerMeter: 17.2 },
            { state: 'Telangana', totalLoadWatts: 14_680_000, activeMeters: 940_000, avgPerMeter: 15.6 },
        ],
    },
};
