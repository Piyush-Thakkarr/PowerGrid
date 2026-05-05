import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const TESTIMONIALS = [
    {
        quote: 'My bill dropped ₹2,100 in month one. The AI handles everything — I changed nothing in my routine. Nothing.',
        name: 'Priya Mehta',
        role: 'Mumbai · Eco Guardian Lv5',
        savings: '₹2,100/mo saved',
    },
    {
        quote: "The XP leaderboard is addictive. I'm ranked third in my neighbourhood and I've redeemed ₹500 off my bill already.",
        name: 'Arjun Sharma',
        role: 'Pune · Grid Master Lv6',
        savings: '₹1,400/mo saved',
    },
    {
        quote: "Solar plus EV plus PowerGrid AI. Last month we exported more than we consumed. I didn't think that was possible.",
        name: 'Kavya Reddy',
        role: 'Hyderabad · Eco Champion',
        savings: '₹3,800/mo saved',
    },
];

export default function Testimonials() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="testi testi-cards" id="testimonials" ref={sectionRef}>
            <div className="wrap">
                <div className="testi-head rv">
                    <div className="stag stag-clean">What users say</div>
                    <h2 className="sh2">Real homes. <em>Real savings.</em></h2>
                </div>

                <div className="testi-grid">
                    {TESTIMONIALS.map((t, i) => (
                        <article
                            key={t.name}
                            className="testi-card rv"
                            style={{ transitionDelay: `${0.15 + i * 0.18}s` }}
                        >
                            <span className="testi-card-quote-mark" aria-hidden="true">“</span>
                            <p className="testi-card-quote">{t.quote}</p>
                            <div className="testi-card-foot">
                                <div className="testi-card-name">
                                    {t.name}
                                    <span className="testi-card-verified" title="Verified user">✓</span>
                                </div>
                                <div className="testi-card-role">{t.role}</div>
                                <div className="testi-card-saved">{t.savings}</div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
