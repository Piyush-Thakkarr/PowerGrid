import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Metrics() {
    const sectionRef = useRef(null);
    useScrollReveal(sectionRef);

    return (
        <section className="metrics" id="metrics" ref={sectionRef}>
            <div className="wrap">
                <div className="rv">
                    <div className="stag">Impact</div>
                    <h2 className="sh2">Numbers that <em>don't lie.</em></h2>
                </div>
                <div className="metrics-row rv" style={{ transitionDelay: '.1s' }}>
                    <div className="mtr">
                        <span className="mtr-l">Avg Annual Saving</span>
                        <span className="mtr-v"><span className="mn">₹78,000</span></span>
                        <div className="mtr-t up">↑ 34% vs prior year</div>
                    </div>
                    <div className="mtr">
                        <span className="mtr-l">Tonnes CO₂ Avoided</span>
                        <span className="mtr-v"><span className="mn">12K</span></span>
                        <div className="mtr-t up">↑ Growing daily</div>
                    </div>
                    <div className="mtr">
                        <span className="mtr-l">AI Uptime</span>
                        <span className="mtr-v"><span className="mn">99.98</span>%</span>
                        <div className="mtr-t up">99.98% SLA</div>
                    </div>
                    <div className="mtr">
                        <span className="mtr-l">Optimizations / Day</span>
                        <span className="mtr-v"><span className="mn">320K</span></span>
                        <div className="mtr-t up">↑ Scaling fast</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
