import React from 'react';
import { motion } from 'framer-motion';

export default function RewardsTab({ gamification, user, loading }) {
    if (loading) return <div className="ch-empty">Loading rewards...</div>;

    const xp = gamification?.xp || { xp: 0, level: 1, progress: 0, xpToNextLevel: 100 };
    const achs = gamification?.achievements || { achievements: [], totalUnlocked: 0, totalAvailable: 0 };
    const challenges = gamification?.challenges || [];
    const lb = gamification?.leaderboard || [];

    return (
        <>
            <div className="dash-hd"><div><h1>Rewards</h1><div className="dash-hd-meta">Level {xp.level}</div></div></div>

            {/* XP */}
            <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Experience <span className="an-count">{xp.xp} XP</span></div>
                    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden', marginTop: '.25rem' }}>
                        <motion.div style={{ height: '100%', background: '#0047AB', borderRadius: 1 }} initial={{ width: 0 }} animate={{ width: `${xp.progress || 0}%` }} transition={{ duration: 1 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', fontFamily: "'DM Mono', monospace", fontSize: '.45rem', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <span>Lvl {xp.level}</span><span>{xp.xpToNextLevel || 100} to next</span><span>Lvl {xp.level + 1}</span>
                    </div>
                </div>
            </div>

            {/* Badges */}
            {achs.achievements?.length > 0 && (
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
                    {achs.achievements.map(b => (
                        <div className="dash-c" key={b.id} style={{ textAlign: 'center', opacity: b.unlocked ? 1 : 0.2 }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{b.icon || '?'}</div>
                            <div style={{ fontSize: '.68rem', fontWeight: 500 }}>{b.name}</div>
                            <div className="dash-sub" style={{ marginTop: '.15rem' }}>{b.description || b.desc}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Challenges */}
            {challenges.length > 0 && (
                <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
                    <div className="dash-c">
                        <div className="dash-lbl">Active Challenges</div>
                        <div className="an-list">
                            {challenges.map(c => (
                                <div className="an-row" key={c.id}>
                                    <div className="an-bar" style={{ background: '#0047AB', height: 24 }} />
                                    <div className="an-info">
                                        <div className="an-date">{c.name}</div>
                                        <div className="an-detail">{c.description || c.desc}</div>
                                    </div>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: 'rgba(255,255,255,0.4)' }}>{Math.min(100, Math.round((c.progress / c.target) * 100))}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            {lb.length > 0 && (
                <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dash-c">
                        <div className="dash-lbl">Leaderboard</div>
                        <div className="an-list">
                            {lb.map(e => (
                                <div className="an-row" key={e.rank} style={{ background: e.userId === user?.id ? 'rgba(0,71,171,0.06)' : 'transparent' }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: 'rgba(255,255,255,0.2)', width: 24, flexShrink: 0 }}>#{e.rank}</span>
                                    <div className="an-info"><div className="an-date">{e.name}</div><div className="an-detail">{e.state}</div></div>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: '#00aaff', flexShrink: 0 }}>{e.savingsPercent}%</span>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: '.5rem' }}>{e.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
