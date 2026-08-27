import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, prefersReducedMotion, utils } from '@/lib/anim.js';

/** Fades/slides page content in on every route change. */
export default function PageTransition({ children }) {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      utils.set(el, { opacity: 1, translateY: 0 });
      return undefined;
    }
    const anim = animate(el, { opacity: [0, 1], translateY: [14, 0], duration: 500, ease: 'outExpo' });
    return () => {
      anim.pause();
      utils.set(el, { opacity: 1, translateY: 0 });
    };
  }, [pathname]);

  return (
    <div ref={ref} style={{ minHeight: '60vh' }}>
      {children}
    </div>
  );
}
