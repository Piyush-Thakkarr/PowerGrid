import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function About() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="about" id="about" ref={sectionRef}>
            <div className="wrap">
                <div className="about-grid">
                    <div className="about-txt rv">
                        <div className="stag">What it is</div>
                        <h2 className="sh2">Your grid, <em>amplified.</em></h2>
                        <p style={{ color: '#fff' }}>PowerGrid connects to your smart meter, solar, and EV to build a live model of your energy world. Our AI finds every inefficiency, every wasted watt — and eliminates it silently in the background.</p>
                        <p style={{ color: '#fff' }}>No new hardware. No behaviour change. Just intelligence applied to your existing infrastructure.</p>
                        <div className="stat-row">
                            <div className="stat"><span className="stat-n" id="sv1">₹6,500</span><span className="stat-l">Avg monthly saved</span></div>
                            <div className="stat"><span className="stat-n" id="sv2">4,200 kg</span><span className="stat-l">CO₂ avoided / yr</span></div>
                            <div className="stat"><span className="stat-n" id="sv3">12,000+</span><span className="stat-l">Active households</span></div>
                        </div>
                    </div>
                    <div className="about-vis rv" style={{ transitionDelay: '.15s' }}>
                        <div className="av-box">
                            <div className="av-head">
                                <span>Live Dashboard</span>
                                <div className="av-live">
                                    <div className="av-ldot"></div>Live
                                </div>
                            </div>
                            <div className="spark" id="spark">
                                {/* Simulated Sparkline bars */}
                                {[38, 52, 45, 67, 55, 78, 62, 88, 74, 92].map((v, i) => (
                                    <div key={i} className="spark-bar" style={{
                                        height: `${(v / 92) * 100}%`,
                                        background: `linear-gradient(to top,hsl(${220 + i * 6},80%,28%),hsl(${220 + i * 6 + 15},90%,52%))`
                                    }}></div>
                                ))}
                            </div>
                            <div className="av-metrics">
                                <div className="avm"><span className="avm-v">24.7</span><span className="avm-l">kWh Today</span></div>
                                <div className="avm"><span className="avm-v" style={{ color: '#ffffff' }}>₹1,240</span><span className="avm-l">AI Saved</span></div>
                                <div className="avm"><span className="avm-v" style={{ color: '#ffffff' }}>87</span><span className="avm-l">Eco Score</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
