import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Testimonials() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="testi" id="testimonials" ref={sectionRef}>
            <div className="wrap">
                <div className="testi-head rv">
                    <div className="stag" style={{ justifyContent: 'center' }}>What users say</div>
                    <h2 className="sh2">Real homes.<br /><em>Real savings.</em></h2>
                    <p>12,000+ households already on the platform.</p>
                </div>
                <div className="testi-row rv" style={{ transitionDelay: '.1s' }}>
                    <div className="tc">
                        <p className="tc-q">My bill dropped ₹2,100 in month one. The AI handles everything — I changed nothing in my routine. Nothing.</p>
                        <div className="tc-p">
                            <div className="tc-av">👩</div>
                            <div>
                                <div className="tc-nm">Priya Mehta</div>
                                <div className="tc-rl">Mumbai · Eco Guardian Lv5</div>
                            </div>
                        </div>
                    </div>
                    <div className="tc">
                        <p className="tc-q">The XP leaderboard is addictive. I'm ranked #3 in my neighbourhood and I've redeemed ₹500 off my bill already.</p>
                        <div className="tc-p">
                            <div className="tc-av">👨</div>
                            <div>
                                <div className="tc-nm">Arjun Sharma</div>
                                <div className="tc-rl">Pune · Grid Master Lv6</div>
                            </div>
                        </div>
                    </div>
                    <div className="tc">
                        <p className="tc-q">Solar + EV + PowerGrid AI. Last month we exported more than we consumed. I didn't think that was possible.</p>
                        <div className="tc-p">
                            <div className="tc-av">👩</div>
                            <div>
                                <div className="tc-nm">Kavya Reddy</div>
                                <div className="tc-rl">Hyderabad · Eco Champion</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
