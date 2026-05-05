import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function CTA() {
    const { user } = useAuth();
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="cta cta-list" id="cta" ref={sectionRef}>
            <div className="cta-orbs" aria-hidden="true">
                <div className="cta-orb cta-orb-a"></div>
                <div className="cta-orb cta-orb-b"></div>
            </div>
            <div className="wrap">
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
            </div>
        </section>
    );
}
