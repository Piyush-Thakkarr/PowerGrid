// Seeded pseudo-random for consistent per-user data
function seededRandom(seed, offset = 0) {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
}

export function generateConsumptionData(userId) {
    const seed = (userId || 'demo').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (min, max, off) => min + seededRandom(seed, off) * (max - min);

    const now = new Date();

    // Hourly - last 24 hours
    const hourly = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(now.getHours() - i, 0, 0, 0);
        const h = hour.getHours();
        let base = 0.3;
        if (h >= 6 && h <= 9) base = 1.2 + rand(0, 0.8, i);
        else if (h >= 10 && h <= 16) base = 0.6 + rand(0, 0.5, i + 10);
        else if (h >= 17 && h <= 22) base = 1.5 + rand(0, 1.0, i + 20);
        else base = 0.2 + rand(0, 0.3, i + 30);
        hourly.push({ time: `${String(h).padStart(2, '0')}:00`, units: Math.round(base * 100) / 100 });
    }

    // Daily - last 7 days
    const daily = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        daily.push({
            day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
            date: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            units: Math.round((8 + rand(0, 12, i + 50)) * 100) / 100,
        });
    }

    // Monthly - last 6 months
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        monthly.push({
            month: d.toLocaleDateString('en-IN', { month: 'short' }),
            units: Math.round((180 + rand(0, 120, i + 100)) * 100) / 100,
        });
    }

    // Heatmap - 7 days x 24 hours
    const heatmap = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            let base = 0.2;
            if (h >= 6 && h <= 9) base = 1.0 + rand(0, 0.6, d * 24 + h);
            else if (h >= 10 && h <= 16) base = 0.5 + rand(0, 0.4, d * 24 + h + 200);
            else if (h >= 17 && h <= 22) base = 1.3 + rand(0, 0.8, d * 24 + h + 400);
            else base = 0.15 + rand(0, 0.2, d * 24 + h + 600);
            // Weekends use more during day
            if (d >= 5 && h >= 10 && h <= 16) base *= 1.4;
            heatmap.push({ day: dayNames[d], hour: h, value: Math.round(base * 100) / 100 });
        }
    }

    return { hourly, daily, monthly, heatmap };
}

// Gujarat GERC slab tariff
export const TARIFF_SLABS = [
    { min: 0, max: 50, rate: 3.45, fixed: 25 },
    { min: 50, max: 100, rate: 4.30, fixed: 0 },
    { min: 100, max: 150, rate: 5.40, fixed: 0 },
    { min: 150, max: 300, rate: 6.30, fixed: 0 },
    { min: 300, max: Infinity, rate: 7.10, fixed: 0 },
];

export function calculateBill(totalUnits) {
    let cost = 0;
    let remaining = totalUnits;
    const breakdown = [];

    for (const slab of TARIFF_SLABS) {
        const slabWidth = slab.max - slab.min;
        const unitsInSlab = Math.min(remaining, slabWidth);
        if (unitsInSlab <= 0) break;
        const slabCost = unitsInSlab * slab.rate + slab.fixed;
        cost += slabCost;
        remaining -= unitsInSlab;
        breakdown.push({
            range: `${slab.min}–${slab.max === Infinity ? '∞' : slab.max}`,
            units: Math.round(unitsInSlab * 100) / 100,
            rate: slab.rate,
            cost: Math.round(slabCost * 100) / 100,
        });
    }

    return { total: Math.round(cost * 100) / 100, breakdown };
}

// Simulated comparison data (other households)
export function generateComparisonData(userId, householdSize, state, actualMonthlyUnits) {
    const seed = (userId || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (min, max, off) => min + seededRandom(seed, off) * (max - min);

    // Use actual monthly units if provided, otherwise fall back to seeded value
    const yourMonthly = actualMonthlyUnits || (180 + rand(0, 120, 100));
    const similarHouseholds = [];
    for (let i = 0; i < 50; i++) {
        similarHouseholds.push(Math.round((140 + seededRandom(i * 7 + seed, 300) * 160) * 100) / 100);
    }
    similarHouseholds.sort((a, b) => a - b);

    const yourRank = similarHouseholds.filter(v => v <= yourMonthly).length;
    const percentile = Math.max(1, Math.round((1 - yourRank / similarHouseholds.length) * 100));

    const avgSimilar = Math.round(similarHouseholds.reduce((s, v) => s + v, 0) / similarHouseholds.length);
    const efficient = similarHouseholds[Math.floor(similarHouseholds.length * 0.1)];
    const median = similarHouseholds[Math.floor(similarHouseholds.length * 0.5)];

    return {
        yourMonthly: Math.round(yourMonthly),
        avgSimilar,
        efficient: Math.round(efficient),
        median: Math.round(median),
        percentile,
        distribution: similarHouseholds,
        yourRank: yourRank + 1,
        totalHouseholds: similarHouseholds.length,
    };
}

// Gamification data
export function generateGamificationData(userId) {
    const seed = (userId || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (min, max, off) => min + seededRandom(seed, off) * (max - min);

    const xp = Math.round(rand(120, 800, 1));
    const level = Math.min(10, Math.floor(xp / 100) + 1);

    const allBadges = [
        { id: 'first_week', name: 'First Week', desc: 'Completed first week of tracking', icon: '⚡' },
        { id: 'under_budget', name: 'Budget Master', desc: 'Stayed under monthly budget', icon: '💰' },
        { id: 'peak_avoider', name: 'Peak Avoider', desc: 'Reduced peak hour usage by 20%', icon: '🌙' },
        { id: 'green_streak', name: 'Green Streak', desc: '7-day low consumption streak', icon: '🌿' },
        { id: 'data_nerd', name: 'Data Nerd', desc: 'Checked analytics 30 times', icon: '📊' },
        { id: 'social_saver', name: 'Social Saver', desc: 'Beat 80% of similar households', icon: '🏆' },
        { id: 'night_owl', name: 'Night Shift', desc: 'Moved 50% load to off-peak', icon: '🦉' },
        { id: 'solar_star', name: 'Solar Star', desc: 'Generated 100kWh from solar', icon: '☀️' },
    ];

    const unlockedCount = Math.min(allBadges.length, Math.floor(rand(2, 6, 5)));
    const badges = allBadges.map((b, i) => ({
        ...b,
        unlocked: i < unlockedCount,
        unlockedAt: i < unlockedCount ? new Date(Date.now() - rand(1, 30, i + 20) * 86400000).toLocaleDateString('en-IN') : null,
    }));

    const leaderboard = [
        { rank: 1, name: 'Priya M.', state: 'Maharashtra', savings: '42%', points: 920 },
        { rank: 2, name: 'Arjun S.', state: 'Gujarat', savings: '38%', points: 870 },
        { rank: 3, name: 'Kavya R.', state: 'Telangana', savings: '35%', points: 810 },
        { rank: 4, name: 'Rahul K.', state: 'Delhi', savings: '31%', points: 740 },
        { rank: 5, name: 'Sneha P.', state: 'Karnataka', savings: '28%', points: 690 },
        { rank: 6, name: 'You', state: '', savings: `${Math.round(rand(15, 30, 99))}%`, points: xp, isYou: true },
        { rank: 7, name: 'Vikram D.', state: 'Tamil Nadu', savings: '22%', points: Math.round(rand(300, 500, 88)) },
        { rank: 8, name: 'Anita G.', state: 'Rajasthan', savings: '19%', points: Math.round(rand(200, 400, 77)) },
    ].sort((a, b) => b.points - a.points).map((entry, i) => ({ ...entry, rank: i + 1 }));

    const challenges = [
        { id: 1, name: 'Off-Peak Champion', desc: 'Use 60% of energy during off-peak hours', target: 60, progress: Math.round(rand(30, 75, 10)), unit: '%', endDate: '5 days left' },
        { id: 2, name: 'Budget Warrior', desc: 'Stay under 250 kWh this month', target: 250, progress: Math.round(rand(120, 200, 20)), unit: 'kWh', endDate: '18 days left' },
        { id: 3, name: 'Reduction Race', desc: 'Reduce consumption by 15% vs last month', target: 15, progress: Math.round(rand(5, 18, 30)), unit: '%', endDate: '18 days left' },
    ];

    return { xp, level, badges, leaderboard, challenges };
}
