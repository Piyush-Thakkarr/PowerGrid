import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, { duration = 1800, start = 0, decimals = 0 } = {}) {
    const [value, setValue] = useState(start);
    const ref = useRef(null);
    const fired = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || fired.current) return;
            fired.current = true;
            const startTime = performance.now();
            const tick = (now) => {
                const elapsed = now - startTime;
                const t = Math.min(1, elapsed / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const next = start + (target - start) * eased;
                setValue(decimals ? parseFloat(next.toFixed(decimals)) : Math.round(next));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { threshold: 0.4 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [target, duration, start, decimals]);

    return [value, ref];
}
