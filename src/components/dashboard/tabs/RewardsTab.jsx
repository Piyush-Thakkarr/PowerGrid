import React from 'react';
import { motion } from 'framer-motion';

export default function RewardsTab({ gamification, user }) {
    const xpInLevel = gamification.xp % 100;
    const xpProgress = xpInLevel === 0 && gamification.xp > 0 ? 100 : xpInLevel;

    return (
        <>
            <div className="dash-page-header">
                <h1>Rewards</h1>
                <span className="dash-page-tag">Level {gamification.level}</span>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Experience</h2>
                    <span className="dash-section-tag">{gamification.xp} XP</span>
                </div>
                <div className="dash-xp-section">
                    <div className="dash-xp-bar-bg">
                        <motion.div className="dash-xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                    </div>
                    <div className="dash-xp-labels">
                        <span>Lvl {gamification.level}</span>
                        <span>{xpProgress}/100 XP to next level</span>
                        <span>Lvl {gamification.level + 1}</span>
                    </div>
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header"><h2>Active Challenges</h2></div>
                <div className="dash-challenges">
                    {gamification.challenges.map(c => (
                        <div className="dash-challenge" key={c.id}>
                            <div className="dash-challenge-info">
                                <strong>{c.name}</strong>
                                <p>{c.desc}</p>
                                <span className="dash-challenge-timer">{c.endDate}</span>
                            </div>
                            <div className="dash-challenge-progress">
                                <div className="dash-progress-ring">
                                    <svg viewBox="0 0 36 36">
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00aaff" strokeWidth="3" strokeDasharray={`${Math.min(100, (c.progress / c.target) * 100)}, 100`} strokeLinecap="round" />
                                    </svg>
                                    <span>{Math.min(100, Math.round((c.progress / c.target) * 100))}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Badges</h2>
                    <span className="dash-section-tag">{gamification.badges.filter(b => b.unlocked).length}/{gamification.badges.length} unlocked</span>
                </div>
                <div className="dash-badges">
                    {gamification.badges.map(b => (
                        <div className={`dash-badge ${b.unlocked ? 'unlocked' : 'locked'}`} key={b.id}>
                            <span className="dash-badge-icon">{b.icon}</span>
                            <span className="dash-badge-name">{b.name}</span>
                            <span className="dash-badge-desc">{b.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dash-card">
                <div className="dash-card-header">
                    <h2>Leaderboard</h2>
                    <span className="dash-section-tag">This month</span>
                </div>
                <div className="dash-leaderboard">
                    {gamification.leaderboard.map(entry => (
                        <div className={`dash-lb-row ${entry.isYou ? 'you' : ''}`} key={entry.rank}>
                            <span className="dash-lb-rank">#{entry.rank}</span>
                            <span className="dash-lb-name">{entry.name}</span>
                            <span className="dash-lb-state">{entry.isYou ? user?.state : entry.state}</span>
                            <span className="dash-lb-savings">{entry.savings}</span>
                            <span className="dash-lb-points">{entry.points} XP</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
