import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const STEPS = [
    { n: '01', title: 'Connect your meter' },
    { n: '02', title: 'AI maps your home' },
    { n: '03', title: 'Auto-optimise silently' },
    { n: '04', title: 'Save, earn, repeat' },
];

export default function Process() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="how how-list" id="how" ref={sectionRef}>
            <div className="wrap">
                <div className="how-head rv">
                    <div className="stag stag-clean">Process</div>
                    <h2 className="sh2">Four steps to <em>zero waste.</em></h2>
                </div>

                <ul className="how-bullets">
                    {STEPS.map((s, i) => (
                        <li
                            key={s.n}
                            className="how-bullet rv"
                            style={{ transitionDelay: `${0.15 + i * 0.2}s` }}
                        >
                            <span className="how-bullet-num">{s.n}</span>
                            <div className="how-bullet-body">
                                <div className="how-bullet-title">{s.title}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
