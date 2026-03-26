import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Process() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="how" id="how" ref={sectionRef}>
            <div className="wrap">
                <div className="stag rv">Process</div>
                <h2 className="sh2 rv" style={{ transitionDelay: '.08s' }}>Four steps to <em>zero waste.</em></h2>
                <div className="how-inner">
                    <div className="how-steps rv" style={{ transitionDelay: '.12s' }}>
                        <div className="hs">
                            <div className="hs-n">01</div>
                            <div className="hs-b">
                                <div className="hs-t">Connect your meter</div>
                                <div className="hs-d">Link your smart meter or upload a bill. No hardware. No electrician. Under five minutes.</div>
                            </div>
                        </div>
                        <div className="hs">
                            <div className="hs-n">02</div>
                            <div className="hs-b">
                                <div className="hs-t">AI maps your home</div>
                                <div className="hs-d">Within seven days our model identifies every device, tariff band, and usage pattern in your home.</div>
                            </div>
                        </div>
                        <div className="hs">
                            <div className="hs-n">03</div>
                            <div className="hs-b">
                                <div className="hs-t">Auto-optimise silently</div>
                                <div className="hs-d">Smart scheduling, demand response and peak avoidance run automatically. You'll only notice your bill.</div>
                            </div>
                        </div>
                        <div className="hs">
                            <div className="hs-n">04</div>
                            <div className="hs-b">
                                <div className="hs-t">Save, earn, repeat</div>
                                <div className="hs-d">Track savings daily. Earn XP for every smart decision. Redeem for cash off your next electricity bill.</div>
                            </div>
                        </div>
                    </div>
                    <div className="terminal rv" style={{ transitionDelay: '.2s' }}>
                        <div className="term-bar">
                            <div className="tdot"></div>
                            <div className="tdot"></div>
                            <div className="tdot"></div>
                            <span className="term-title">powergrid.ai — terminal</span>
                        </div>
                        <span className="tl prompt" style={{ animationDelay: '.3s' }}>connect --meter smart-grid-api</span>
                        <span className="tl out" style={{ animationDelay: '.7s' }}>Connecting to BSES Mumbai grid...</span>
                        <span className="tl ok" style={{ animationDelay: '1.1s' }}>✓ Meter linked. 14 days data ingested.</span>
                        <span className="tl out" style={{ animationDelay: '1.5s' }}>&nbsp;</span>
                        <span className="tl prompt" style={{ animationDelay: '1.6s' }}>run ai-scan --full</span>
                        <span className="tl out" style={{ animationDelay: '2.0s' }}>Identifying devices...</span>
                        <span className="tl val" style={{ animationDelay: '2.4s' }}> EV Charger → 2.1 kWh (32%)</span>
                        <span className="tl val" style={{ animationDelay: '2.7s' }}> AC / Heating → 1.8 kWh (27%)</span>
                        <span className="tl val" style={{ animationDelay: '3.0s' }}> Kitchen → 0.9 kWh (14%)</span>
                        <span className="tl val" style={{ animationDelay: '3.3s' }}> + 3 more devices detected</span>
                        <span className="tl out" style={{ animationDelay: '3.7s' }}>&nbsp;</span>
                        <span className="tl prompt" style={{ animationDelay: '3.8s' }}>optimise --auto --apply</span>
                        <span className="tl ok" style={{ animationDelay: '4.3s' }}>✓ Peak shaving active</span>
                        <span className="tl ok" style={{ animationDelay: '4.6s' }}>✓ EV shifted → 11PM off-peak</span>
                        <span className="tl ok" style={{ animationDelay: '4.9s' }}>✓ Solar forecast loaded</span>
                        <span className="tl em" style={{ animationDelay: '5.3s' }}>→ Projected monthly saving: ₹2,100</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
