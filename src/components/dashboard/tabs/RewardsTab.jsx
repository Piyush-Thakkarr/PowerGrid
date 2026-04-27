import React from 'react';
import { motion } from 'framer-motion';

export default function RewardsTab({ gamification, user, loading }) {
    if (loading) return <div className="ch-empty">Loading rewards...</div>;

    const xp = gamification?.xp || { xp: 0, level: 1, progress: 0, xpToNextLevel: 100 };
    const achs = gamification?.achievements || { achievements: [], totalUnlocked: 0, totalAvailable: 0 };
    const challenges = gamification?.challenges || [];
    const lb = gamification?.leaderboard || [];
    const unlocked = achs.totalUnlocked || 0;
    const total = achs.totalAvailable || 0;

    return (
        <>
            <div className="dash-hd"><div><h1>Rewards</h1><div className="dash-hd-meta">Level {xp.level} · {xp.xp} XP</div></div></div>

            {/* Top row: XP + Stats */}
            <div className="dash-grid" style={{ gridTemplateColumns: '8fr 2fr 2fr', marginBottom: '1rem' }}>
                <div className="dash-c">
                    <div className="dash-lbl">Experience</div>
                    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden', marginTop: '.5rem' }}>
                        <motion.div style={{ height: '100%', background: '#0047AB', borderRadius: 1 }} initial={{ width: 0 }} animate={{ width: `${xp.progress || 0}%` }} transition={{ duration: 1 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', fontFamily: "'DM Mono', monospace", fontSize: '.45rem', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <span>Lvl {xp.level}</span><span>Lvl {xp.level + 1}</span>
                    </div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Badges</div>
                    <div className="n-lg">{unlocked}<span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.2)' }}>/{total}</span></div>
                </div>
                <div className="dash-c">
                    <div className="dash-lbl">Challenges</div>
                    <div className="n-lg">{challenges.length}</div>
                    <div className="dash-sub">active</div>
                </div>
            </div>

            {/* Badges + Challenges side by side */}
            <div className="dash-grid" style={{ gridTemplateColumns: '7fr 5fr', marginBottom: '1rem' }}>
                {/* Badges */}
                <div className="dash-c">
                    <div className="dash-lbl">Achievements <span className="an-count">{unlocked} unlocked</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.03)', marginTop: '.5rem' }}>
                        {(achs.achievements || []).map(b => (
                            <div key={b.id} style={{ background: '#050508', padding: '.7rem .5rem', textAlign: 'center', opacity: b.unlocked ? 1 : 0.15 }}>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.9rem', fontWeight: 500, color: b.unlocked ? '#fff' : 'rgba(255,255,255,0.3)', marginBottom: '.25rem' }}>
                                    {b.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div style={{ fontSize: '.58rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{b.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Challenges */}
                <div className="dash-c">
                    <div className="dash-lbl">Active Challenges</div>
                    <div className="an-list" style={{ marginTop: '.3rem' }}>
                        {challenges.map(c => {
                            const pct = c.target > 0 ? Math.min(100, Math.round((c.progress / c.target) * 100)) : 0;
                            return (
                                <div className="an-row" key={c.id}>
                                    <div style={{ width: 3, height: 28, borderRadius: 1, background: pct >= 100 ? '#00aaff' : '#0047AB', flexShrink: 0 }} />
                                    <div className="an-info">
                                        <div className="an-date">{c.name}</div>
                                        <div className="an-detail">{c.description || c.desc}</div>
                                    </div>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', color: pct >= 100 ? '#00aaff' : 'rgba(255,255,255,0.35)' }}>{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            {lb.length > 0 && (
                <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="dash-c">
                        <div className="dash-lbl">Leaderboard <span className="an-count">This month</span></div>
                        <div style={{ marginTop: '.3rem' }}>
                            {lb.map(e => {
                                const isYou = e.userId === user?.id || e.name === user?.name;
                                return (
                                    <div key={e.rank} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.025)', background: isYou ? 'rgba(0,71,171,0.06)' : 'transparent', paddingLeft: isYou ? '.5rem' : 0, borderRadius: isYou ? 2 : 0 }}>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.55rem', color: 'rgba(255,255,255,0.2)', width: 20 }}>#{e.rank}</span>
                                        <span style={{ flex: 1, fontSize: '.78rem', fontWeight: isYou ? 500 : 400, color: isYou ? '#fff' : 'rgba(255,255,255,0.6)' }}>{e.name}</span>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.58rem', color: '#00aaff' }}>{e.savingsPercent}%</span>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.55rem', color: 'rgba(255,255,255,0.2)', width: 40, textAlign: 'right' }}>{e.points}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
