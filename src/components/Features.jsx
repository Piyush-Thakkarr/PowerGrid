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
            </div>
        </section>
    );
}
