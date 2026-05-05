import React, { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function About() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    const [watts, setWatts] = useState(847);

    useEffect(() => {
        const id = setInterval(() => {
            setWatts(w => {
                const drift = (Math.random() - 0.5) * 120;
                const next = Math.max(420, Math.min(1850, w + drift));
                return Math.round(next);
            });
        }, 1600);
        return () => clearInterval(id);
    }, []);

    return (
        <section className="about" id="about" ref={sectionRef}>
            <div className="wrap">
                <div className="about-grid">
                    <div className="about-txt rv">
                        <div className="stag stag-clean">What it is</div>
                        <h2 className="sh2">Your Grid, <em>Amplified.</em></h2>
                        <p className="about-lead">PowerGrid connects to your smart meter, solar, and EV to build a live model of your energy world. Our AI finds every inefficiency, every wasted watt and eliminates it silently in the background. No new hardware. No behaviour change. Just intelligence applied to your existing infrastructure.</p>
                    </div>

                    <div className="about-vis rv" style={{ transitionDelay: '.18s' }}>
                        <div className="ev-graph">
                            <div className="ev-graph-head">
                                <div className="ev-graph-title">
                                    <span className="ev-live-dot" aria-hidden="true"></span>
                                    Live Power Consumption
                                </div>
                                <div className="ev-graph-watts">
                                    <span className="ev-watts-num">{watts.toLocaleString('en-IN')}</span>
                                    <span className="ev-watts-unit">W</span>
                                </div>
                            </div>

                            <div className="ev-chart">
                                <svg className="ev-svg" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="evArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(0,170,255,0.55)" />
                                            <stop offset="60%" stopColor="rgba(0,170,255,0.12)" />
                                            <stop offset="100%" stopColor="rgba(0,170,255,0)" />
                                        </linearGradient>
                                        <linearGradient id="evLine" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#0047AB" />
                                            <stop offset="50%" stopColor="#00aaff" />
                                            <stop offset="100%" stopColor="#82C8E5" />
                                        </linearGradient>
                                        <filter id="evGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="b" />
                                            <feMerge>
                                                <feMergeNode in="b" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    <g className="ev-grid" stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                                        <line x1="0" y1="40" x2="800" y2="40" />
                                        <line x1="0" y1="80" x2="800" y2="80" />
                                        <line x1="0" y1="120" x2="800" y2="120" />
                                        <line x1="0" y1="160" x2="800" y2="160" />
                                    </g>

                                    <g className="ev-scroll">
                                        <path className="ev-area" fill="url(#evArea)"
                                            d="M0,200 L0,120 C30,90 60,150 90,110 C120,70 150,140 180,95 C210,55 240,135 270,90 C300,115 330,55 360,125 C380,145 395,95 400,120 C430,90 460,150 490,110 C520,70 550,140 580,95 C610,55 640,135 670,90 C700,115 730,55 760,125 C780,145 795,95 800,120 L800,200 Z" />
                                        <path className="ev-line" fill="none" stroke="url(#evLine)" strokeWidth="2.4" strokeLinecap="round" filter="url(#evGlow)"
                                            d="M0,120 C30,90 60,150 90,110 C120,70 150,140 180,95 C210,55 240,135 270,90 C300,115 330,55 360,125 C380,145 395,95 400,120 C430,90 460,150 490,110 C520,70 550,140 580,95 C610,55 640,135 670,90 C700,115 730,55 760,125 C780,145 795,95 800,120" />
                                    </g>

                                    <g className="ev-pulse">
                                        <circle cx="400" cy="120" r="4" fill="#00aaff" filter="url(#evGlow)" />
                                        <circle cx="400" cy="120" r="10" fill="none" stroke="rgba(0,170,255,0.6)" strokeWidth="1" className="ev-ping" />
                                    </g>

                                    <line x1="400" y1="0" x2="400" y2="200" stroke="rgba(0,170,255,0.18)" strokeWidth="1" strokeDasharray="2 4" />
                                </svg>

                                <div className="ev-axis">
                                    <span>−12h</span>
                                    <span>−6h</span>
                                    <span className="ev-axis-now">NOW</span>
                                </div>
                            </div>

                            <div className="ev-readouts">
                                <div className="ev-read">
                                    <span className="ev-read-l">Today</span>
                                    <span className="ev-read-v">24.7 <i>kWh</i></span>
                                </div>
                                <div className="ev-read">
                                    <span className="ev-read-l">Saved</span>
                                    <span className="ev-read-v">₹1,240</span>
                                </div>
                                <div className="ev-read">
                                    <span className="ev-read-l">Eco Score</span>
                                    <span className="ev-read-v">87</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
