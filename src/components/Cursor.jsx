import React, { useEffect, useRef, useState } from 'react';

export default function Cursor() {
    const reqIdRef = useRef(null);
    const clickTimers = useRef([]);
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
            setIsTouch(true);
            return;
        }
        const curEl = document.getElementById('cur');
        let cmx = 0, cmy = 0, ccx = 0, ccy = 0;

        const onMouseMove = e => { cmx = e.clientX; cmy = e.clientY; };
        document.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            ccx += (cmx - ccx) * .12;
            ccy += (cmy - ccy) * .12;
            if (curEl) { curEl.style.left = ccx + 'px'; curEl.style.top = ccy + 'px'; }
            reqIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        const onMouseDown = () => document.body.classList.add('ck');
        const onMouseUp = () => document.body.classList.remove('ck');
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        const onClick = e => {
            [60, 110, 180].forEach((sz, i) => {
                const r = document.createElement('div');
                r.className = 'click-ring';
                r.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${sz}px;height:${sz}px;animation-delay:${i * .08}s;border-color:rgba(0,${170 + i * 25},255,${.7 - i * .15})`;
                document.body.appendChild(r);
                const timer = setTimeout(() => r.remove(), 900);
                clickTimers.current.push(timer);
            });
        };
        window.addEventListener('click', onClick);

        // Energy meter
        const emeter = document.getElementById('emeter');
        let lastX = 0, lastY = 0, energy = 0;
        const onMouseMoveEMeter = e => {
            const vx = e.clientX - lastX, vy = e.clientY - lastY;
            energy = Math.min(1, energy + Math.sqrt(vx * vx + vy * vy) * .003);
            lastX = e.clientX; lastY = e.clientY;
        };
        document.addEventListener('mousemove', onMouseMoveEMeter);

        const intervalId = setInterval(() => {
            energy *= .92;
            if (emeter) {
                emeter.style.transform = `scaleX(${energy})`;
                emeter.classList.toggle('active', energy > .05);
            }
        }, 30);

        // Hover effects
        const hoverEntries = [];
        const attachHover = () => {
            document.querySelectorAll('a,button,.fc,.tc,.mtr,.hs').forEach(el => {
                if (!el.dataset.hoverAttached) {
                    const enter = () => document.body.classList.add('ch');
                    const leave = () => document.body.classList.remove('ch');
                    el.addEventListener('mouseenter', enter);
                    el.addEventListener('mouseleave', leave);
                    el.dataset.hoverAttached = 'true';
                    hoverEntries.push({ el, enter, leave });
                }
            });
        };
        const hoverTimeout = setTimeout(attachHover, 500);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('click', onClick);
            document.removeEventListener('mousemove', onMouseMoveEMeter);
            cancelAnimationFrame(reqIdRef.current);
            clearInterval(intervalId);
            clearTimeout(hoverTimeout);
            clickTimers.current.forEach(clearTimeout);
            clickTimers.current = [];
            hoverEntries.forEach(({ el, enter, leave }) => {
                el.removeEventListener('mouseenter', enter);
                el.removeEventListener('mouseleave', leave);
                delete el.dataset.hoverAttached;
            });
        };
    }, []);

    if (isTouch) return null;

    return (
        <div className="cur" id="cur">
            <div className="cur-x"></div>
            <div className="cur-ring"></div>
        </div>
    );
}
