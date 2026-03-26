import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Features() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="features" id="features" ref={sectionRef}>
            <div className="wrap">
                <div className="feat-head rv">
                    <div>
                        <div className="stag">Capabilities</div>
                        <h2 className="sh2">Six modules. <em>One intelligence.</em></h2>
                    </div>
                    <div className="feat-count">06 core features</div>
                </div>
                <div className="feat-grid rv" style={{ transitionDelay: '.1s' }}>
                    <div className="fc">
                        <div className="fc-num">01</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg></div>
                        <div className="fc-nm">AI Load Optimizer</div>
                        <div className="fc-desc">Shifts EV charging, washing machines and dishwashers to off-peak windows. Fully automatic, no input required.</div>
                    </div>
                    <div className="fc">
                        <div className="fc-num">02</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-5 5" /></svg></div>
                        <div className="fc-nm">Peak Shaving Engine</div>
                        <div className="fc-desc">Detects demand spikes in real time and sheds non-critical loads before your tariff band triggers a cost surge.</div>
                    </div>
                    <div className="fc">
                        <div className="fc-num">03</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg></div>
                        <div className="fc-nm">Solar Intelligence</div>
                        <div className="fc-desc">Forecasts tomorrow's solar output and pre-schedules consumption to maximise self-use before sunrise.</div>
                    </div>
                    <div className="fc">
                        <div className="fc-num">04</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
                        <div className="fc-nm">XP Reward System</div>
                        <div className="fc-desc">Every smart action earns points. Compete on neighbourhood leaderboards. Redeem XP for real bill credits.</div>
                    </div>
                    <div className="fc">
                        <div className="fc-num">05</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div>
                        <div className="fc-nm">Bill Guardian</div>
                        <div className="fc-desc">Alerts you when usage is trending toward a higher bill tier. Intervenes automatically if you grant permission.</div>
                    </div>
                    <div className="fc">
                        <div className="fc-num">06</div>
                        <div className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 2a10 10 0 0 1 10 10" /><path d=" M12 2s-4 4-4 10 4 10 4 10" /><path d=" M12 2s4 4 4 10-4 10-4 10" /><path d="M2 12h20" /></svg></div>
                        <div className="fc-nm">Carbon Tracker</div>
                        <div className="fc-desc">Real-time CO₂ footprint per device. See your household's climate impact and what it's worth in carbon credits.</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
