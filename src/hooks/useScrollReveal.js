import { useEffect } from 'react';

export function useScrollReveal(sectionRef, { threshold = 0.1, once = true } = {}) {
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    if (once) observer.unobserve(e.target);
                }
            });
        }, { threshold });

        const els = sectionRef.current?.querySelectorAll('.rv');
        if (els) els.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);
}
