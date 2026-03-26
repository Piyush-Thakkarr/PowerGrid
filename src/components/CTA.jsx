import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function CTA() {
    const { user } = useAuth();
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="cta" id="cta" ref={sectionRef}>
            <div className="section-inner">
                <div className="cta-inner rv">
                    <div className="stag" style={{ justifyContent: 'center' }}>Limited Beta</div>
                    <h2 className="sh2">Stop leaving<br /><em>money on the grid.</em></h2>
                    <p>Setup takes under five minutes. Your first month is free. No hardware, no credit card.</p>
                    <div className="cta-btns">
                        {user ? (
                            <Link to="/dashboard" className="btn-p"><span>Go to Dashboard</span><span>→</span></Link>
                        ) : (
                            <Link to="/signup" className="btn-p"><span>Claim Free Access</span><span>→</span></Link>
                        )}
                        <a href="#features" className="nav-btn" style={{ padding: '.85rem 2rem' }}>Explore Features</a>
                    </div>
                    {!user && <div className="cta-note">No credit card · No hardware · Cancel anytime</div>}
                </div>
            </div>
        </section>
    );
}
