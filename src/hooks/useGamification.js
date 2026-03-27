import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useGamification() {
    const [achievements, setAchievements] = useState({ achievements: [], totalUnlocked: 0, totalAvailable: 0 });
    const [challenges, setChallenges] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [xp, setXp] = useState({ xp: 0, level: 1, xpToNextLevel: 100, progress: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            apiFetch('/api/gamification/achievements'),
            apiFetch('/api/gamification/challenges'),
            apiFetch('/api/gamification/leaderboard'),
            apiFetch('/api/gamification/xp'),
        ])
            .then(([ach, ch, lb, xpRes]) => {
                if (!cancelled) {
                    setAchievements(ach);
                    setChallenges(ch);
                    setLeaderboard(lb);
                    setXp(xpRes);
                }
            })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    return { achievements, challenges, leaderboard, xp, loading, error };
}
