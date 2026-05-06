import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';

export default function Metrics() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    const [savings, savingsRef] = useCountUp(78000);
    const [co2, co2Ref] = useCountUp(12);
    const [uptime, uptimeRef] = useCountUp(99.98, { decimals: 2 });
    const [opts, optsRef] = useCountUp(320);

    const items = [
        { ref: savingsRef, label: 'Average annual saving per household', value: `₹${savings.toLocaleString('en-IN')}` },
        { ref: co2Ref, label: 'Tonnes of CO₂ avoided across the network', value: `${co2}K` },
        { ref: uptimeRef, label: 'AI uptime since launch', value: `${uptime}%` },
        { ref: optsRef, label: 'Optimization decisions taken every day', value: `${opts}K` },
    ];

    const bars = [42, 58, 67, 78, 71, 85, 92, 88, 76, 81, 89, 95];

    return (
        <section className="metrics metrics-list" id="metrics" ref={sectionRef}>
            <div className="wrap">
                <div className="metrics-head rv">
                    <div className="stag stag-clean">Impact</div>
                    <h2 className="sh2">Numbers that <em>don't lie.</em></h2>
                    <p className="metrics-lead">Real data from twelve thousand active households — measured, audited and growing every single day.</p>
                </div>

                <div className="metrics-split">
                    <div className="metrics-vis rv" style={{ transitionDelay: '.2s' }}>
                        <div className="kpi-panel">
                            <div className="kpi-panel-head">
                                <div className="kpi-panel-title">
                                    <span className="kpi-live-dot"></span>
                                    Network · Live
                                </div>
                                <div className="kpi-panel-sub">Last 12 months</div>
                            </div>

                            <div className="kpi-bigrow">
                                <div className="kpi-big">
                                    <span className="kpi-big-l">Households saved</span>
                                    <span className="kpi-big-v">₹93.6 Cr</span>
                                </div>
                                <div className="kpi-spark">
                                    <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(0,170,255,0.6)" />
                                                <stop offset="100%" stopColor="rgba(0,170,255,0)" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,50 C20,40 40,45 60,30 C80,18 100,25 120,15 C140,8 160,12 180,5 L200,3 L200,60 L0,60 Z" fill="url(#sparkArea)" />
                                        <path d="M0,50 C20,40 40,45 60,30 C80,18 100,25 120,15 C140,8 160,12 180,5 L200,3" fill="none" stroke="#00aaff" strokeWidth="1.6" />
                                    </svg>
                                </div>
                            </div>

                            <div className="kpi-bars">
                                {bars.map((h, i) => (
                                    <div key={i} className="kpi-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }}></div>
                                ))}
                            </div>

                            <div className="kpi-foot">
                                <div className="kpi-foot-cell">
                                    <span className="kpi-foot-l">Avg savings</span>
                                    <span className="kpi-foot-v">₹6,500/mo</span>
                                </div>
                                <div className="kpi-foot-cell">
                                    <span className="kpi-foot-l">CO₂ saved</span>
                                    <span className="kpi-foot-v">12K tonnes</span>
                                </div>
                                <div className="kpi-foot-cell">
                                    <span className="kpi-foot-l">Uptime</span>
                                    <span className="kpi-foot-v">99.98%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ul className="met-bullets">
                        {items.map((m, i) => (
                            <li
                                key={m.label}
                                ref={m.ref}
                                className="met-bullet rv"
                                style={{ transitionDelay: `${0.15 + i * 0.18}s` }}
                            >
                                <span className="met-bullet-mark" aria-hidden="true">◆</span>
                                <div className="met-bullet-body">
                                    <div className="met-bullet-row">
                                        <span className="met-bullet-value">{m.value}</span>
                                    </div>
                                    <div className="met-bullet-label">{m.label}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
