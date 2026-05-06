import React, { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const STEPS = [
    { n: '01', title: 'Connect your meter' },
    { n: '02', title: 'AI maps your home' },
    { n: '03', title: 'Auto-optimise silently' },
    { n: '04', title: 'Save, earn, repeat' },
];

const TERMINAL_LINES = [
    { type: 'prompt', text: 'connect --meter smart-grid-api' },
    { type: 'out', text: 'Connecting to BSES Mumbai grid...' },
    { type: 'ok', text: '✓ Meter linked. 14 days data ingested.' },
    { type: 'spacer', text: '' },
    { type: 'prompt', text: 'run ai-scan --full' },
    { type: 'val', text: '  EV Charger → 2.1 kWh (32%)' },
    { type: 'val', text: '  AC / Heating → 1.8 kWh (27%)' },
    { type: 'val', text: '  Kitchen → 0.9 kWh (14%)' },
    { type: 'spacer', text: '' },
    { type: 'prompt', text: 'optimise --auto --apply' },
    { type: 'ok', text: '✓ Peak shaving active' },
    { type: 'ok', text: '✓ EV shifted → 11PM off-peak' },
    { type: 'em', text: '→ Projected saving: ₹2,100/mo' },
];

export default function Process() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    const [visible, setVisible] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setVisible(v => (v >= TERMINAL_LINES.length ? 0 : v + 1));
        }, 600);
        return () => clearInterval(id);
    }, []);

    return (
        <section className="how how-list" id="how" ref={sectionRef}>
            <div className="wrap">
                <div className="how-head rv">
                    <div className="stag stag-clean">Process</div>
                    <h2 className="sh2">Four steps to <em>zero waste.</em></h2>
                </div>

                <div className="how-split">
                    <div className="how-vis rv" style={{ transitionDelay: '.2s' }}>
                        <div className="terminal">
                            <div className="term-bar">
                                <div className="tdot"></div>
                                <div className="tdot"></div>
                                <div className="tdot"></div>
                                <span className="term-title">powergrid.ai — terminal</span>
                            </div>
                            <div className="term-body">
                                {TERMINAL_LINES.map((line, i) => (
                                    <span
                                        key={i}
                                        className={`tl tl-${line.type}${i < visible ? ' tl-show' : ''}`}
                                    >
                                        {line.text || ' '}
                                    </span>
                                ))}
                            </div>
                        </div>
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
            </div>
        </section>
    );
}
