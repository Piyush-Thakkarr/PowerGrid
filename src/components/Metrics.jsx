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

    return (
        <section className="metrics metrics-list" id="metrics" ref={sectionRef}>
            <div className="wrap">
                <div className="metrics-head rv">
                    <div className="stag stag-clean">Impact</div>
                    <h2 className="sh2">Numbers that <em>don't lie.</em></h2>
                    <p className="metrics-lead">Real data from twelve thousand active households — measured, audited and growing every single day.</p>
                </div>

                <ul className="met-bullets">
                    {items.map((m, i) => (
                        <li
                            key={m.label}
                            ref={m.ref}
                            className="met-bullet rv"
                            style={{ transitionDelay: `${0.15 + i * 0.2}s` }}
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
        </section>
    );
}
