import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function CTA() {
    const { user } = useAuth();
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    const [savings, setSavings] = useState(0);

    useEffect(() => {
        const target = 78000;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / 2400);
            const eased = 1 - Math.pow(1 - t, 3);
            setSavings(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(tick);
        };
        const id = setTimeout(() => requestAnimationFrame(tick), 800);
        return () => clearTimeout(id);
    }, []);

    return (
        <section className="cta cta-list" id="cta" ref={sectionRef}>
            <div className="cta-orbs" aria-hidden="true">
                <div className="cta-orb cta-orb-a"></div>
                <div className="cta-orb cta-orb-b"></div>
            </div>
            <div className="wrap">
                <div className="cta-split">
                    <div className="cta-inner rv">
                        <div className="stag stag-clean">Limited Beta</div>
                        <h2 className="sh2">Stop leaving <em>money on the grid.</em></h2>
                        <p className="cta-lead">Setup takes under five minutes. Your first month is free. No hardware. No credit card. Cancel any time.</p>

                        <div className="cta-btns">
                            {user ? (
                                <Link to="/dashboard" className="btn-p btn-pulse"><span>Go to Dashboard</span><span>→</span></Link>
                            ) : (
                                <Link to="/signup" className="btn-p btn-pulse"><span>Claim Free Access</span><span>→</span></Link>
                            )}
                            <a href="#features" className="nav-btn" style={{ padding: '.85rem 2rem' }}>Explore Features</a>
                        </div>
                    </div>

                    <div className="cta-vis rv" style={{ transitionDelay: '.25s' }}>
                        <div className="save-card">
                            <div className="save-card-head">
                                <span className="save-card-tag">Year-1 projected</span>
                                <span className="save-card-pulse"></span>
                            </div>
                            <div className="save-card-amount">
                                <span className="save-card-currency">₹</span>
                                <span className="save-card-num">{savings.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="save-card-sub">saved by an average household</div>

                            <div className="save-card-meter">
                                <div className="save-card-meter-fill"></div>
                            </div>

                            <ul className="save-card-bullets">
                                <li><span>⚡</span> Smart load shifting</li>
                                <li><span>☀</span> Solar self-use up to 84%</li>
                                <li><span>🏆</span> XP redemptions on every bill</li>
                            </ul>

                            <div className="save-card-foot">
                                <div className="save-card-coin save-card-coin-1">₹</div>
                                <div className="save-card-coin save-card-coin-2">₹</div>
                                <div className="save-card-coin save-card-coin-3">₹</div>
                                <div className="save-card-coin save-card-coin-4">₹</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
