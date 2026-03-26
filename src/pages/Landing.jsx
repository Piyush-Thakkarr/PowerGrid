import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PowerGrid from '../components/PowerGrid';
import ParticleText from '../components/ParticleText';
import Cursor from '../components/Cursor';
import About from '../components/About';
import Features from '../components/Features';
import Process from '../components/Process';
import Metrics from '../components/Metrics';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Landing() {
    const { user } = useAuth();

    return (
        <>
            <Cursor />
            <PowerGrid />

            <div className="vg"></div>
            <div className="scan"></div>

            <div className="emeter" id="emeter"></div>

            <div className="hint">
                <div className="hint-row">
                    <div className="hint-ico">↕</div>
                    Move — magnetic pull
                </div>
                <div className="hint-row">
                    <div className="hint-ico">⚡</div>
                    Click — shockwave + lightning
                </div>
            </div>

            <section className="hero">
                <div className="hero-label">Interactive Engine</div>
                <ParticleText />
                <div className="hero-body">
                    <p className="hero-sub">
                        The power grid reconstructed in WebGL. Experience magnetic repulsion and recursive raycasted lightnings.
                    </p>
                    <div className="hero-actions">
                        {user ? (
                            <Link to="/dashboard" className="btn-p"><span>Go to Dashboard</span></Link>
                        ) : (
                            <>
                                <Link to="/signup" className="btn-p"><span>Get Started</span></Link>
                                <Link to="/login" className="btn-s">Sign In</Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <div className="div-line"></div>
            <About />
            <div className="div-line"></div>
            <Features />
            <div className="div-line"></div>
            <Process />
            <div className="div-line"></div>
            <Metrics />
            <div className="div-line"></div>
            <Testimonials />
            <div className="div-line"></div>
            <CTA />
            <Footer />
        </>
    );
}
