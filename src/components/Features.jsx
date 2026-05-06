import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const FEATURES = [
    {
        name: 'AI Load Optimizer',
        desc: 'Shifts EV charging, washing machines and dishwashers to off-peak windows. Fully automatic, no input required.',
    },
    {
        name: 'Peak Shaving Engine',
        desc: 'Detects demand spikes in real time and sheds non-critical loads before your tariff band triggers a cost surge.',
    },
    {
        name: 'Solar Intelligence',
        desc: "Forecasts tomorrow's solar output and pre-schedules consumption to maximise self-use before sunrise.",
    },
    {
        name: 'XP Reward System',
        desc: 'Every smart action earns points. Compete on neighbourhood leaderboards. Redeem XP for real bill credits.',
    },
    {
        name: 'Bill Guardian',
        desc: 'Alerts you when usage is trending toward a higher bill tier. Intervenes automatically if you grant permission.',
    },
    {
        name: 'Carbon Tracker',
        desc: "Real-time CO₂ footprint per device. See your household's climate impact and what it's worth in carbon credits.",
    },
];

const ORBIT_LABELS = ['LOAD', 'PEAK', 'SOLAR', 'XP', 'BILL', 'CO₂'];

export default function Features() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="features features-list" id="features" ref={sectionRef}>
            <div className="wrap">
                <div className="features-head rv">
                    <div className="stag stag-clean">Capabilities</div>
                    <h2 className="sh2">Six modules. <em>One intelligence.</em></h2>
                    <p className="features-lead">Every PowerGrid module works in the background silently optimizing your home's energy without you lifting a finger.</p>
                </div>

                <div className="features-split">
                    <ul className="feat-bullets">
                        {FEATURES.map((f, i) => (
                            <li
                                key={f.name}
                                className="feat-bullet rv"
                                style={{ transitionDelay: `${0.15 + i * 0.18}s` }}
                            >
                                <span className="feat-bullet-mark" aria-hidden="true">◆</span>
                                <div className="feat-bullet-body">
                                    <div className="feat-bullet-title"><span className="brand-grad">{f.name}</span></div>
                                    <div className="feat-bullet-desc">{f.desc}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="features-vis rv" style={{ transitionDelay: '.25s' }}>
                        <div className="orbit">
                            <div className="orbit-glow" aria-hidden="true"></div>
                            <svg className="orbit-svg" viewBox="0 0 320 320" aria-hidden="true">
                                <defs>
                                    <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#82C8E5" />
                                        <stop offset="55%" stopColor="#00aaff" />
                                        <stop offset="100%" stopColor="#0047AB" />
                                    </radialGradient>
                                    <filter id="orbGlow" x="-30%" y="-30%" width="160%" height="160%">
                                        <feGaussianBlur stdDeviation="3" result="b" />
                                        <feMerge>
                                            <feMergeNode in="b" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                {/* Concentric rings */}
                                <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(0,170,255,0.08)" strokeWidth="1" />
                                <circle cx="160" cy="160" r="110" fill="none" stroke="rgba(0,170,255,0.12)" strokeWidth="1" strokeDasharray="2 6" />
                                <circle cx="160" cy="160" r="70" fill="none" stroke="rgba(0,170,255,0.18)" strokeWidth="1" />

                                {/* Connection lines from hub to satellites */}
                                <g className="orbit-lines" stroke="rgba(0,170,255,0.35)" strokeWidth="1">
                                    {ORBIT_LABELS.map((_, i) => {
                                        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                                        const x = 160 + Math.cos(angle) * 110;
                                        const y = 160 + Math.sin(angle) * 110;
                                        return <line key={i} x1="160" y1="160" x2={x} y2={y} />;
                                    })}
                                </g>

                                {/* Rotating satellites group */}
                                <g className="orbit-satellites">
                                    {ORBIT_LABELS.map((label, i) => {
                                        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                                        const x = 160 + Math.cos(angle) * 110;
                                        const y = 160 + Math.sin(angle) * 110;
                                        return (
                                            <g key={label} className="orbit-sat" style={{ animationDelay: `${i * 0.4}s` }}>
                                                <circle cx={x} cy={y} r="18" fill="rgba(0,8,22,0.95)" stroke="rgba(0,170,255,0.5)" strokeWidth="1.5" filter="url(#orbGlow)" />
                                                <text x={x} y={y + 3} textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9" fill="#82C8E5" letterSpacing="1">{label}</text>
                                            </g>
                                        );
                                    })}
                                </g>

                                {/* Central hub */}
                                <circle cx="160" cy="160" r="34" fill="url(#hubGrad)" filter="url(#orbGlow)" />
                                <circle cx="160" cy="160" r="46" fill="none" stroke="rgba(0,170,255,0.45)" strokeWidth="1" className="hub-ring" />
                                <text x="160" y="164" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fontWeight="600" fill="#fff" letterSpacing="2">AI</text>
                            </svg>
                            <div className="orbit-caption">
                                <span className="orbit-caption-label">Powered by</span>
                                <span className="orbit-caption-brand">PowerGrid AI Core</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
