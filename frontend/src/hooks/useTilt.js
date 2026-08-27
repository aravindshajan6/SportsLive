import { useEffect, useRef } from 'react';
import { createTiltController } from '@/lib/anim.js';

/**
 * 3D tilt-on-hover. Attach `ref` to the card (needs `transform-style: preserve-3d` + a parent with `perspective`).
 * Optionally pass a glare element ref to move a radial highlight.
 */
export function useTilt({ max = 10, scale = 1.02, disabled = false } = {}) {
  const ref = useRef(null);
  const glareRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;
    if (window.matchMedia?.('(hover: none)').matches) return undefined; // touch devices: skip
    const ctrl = createTiltController(el, { max, scale, glare: glareRef.current });
    el.addEventListener('pointermove', ctrl.onMove);
    el.addEventListener('pointerleave', ctrl.onLeave);
    return () => {
      el.removeEventListener('pointermove', ctrl.onMove);
      el.removeEventListener('pointerleave', ctrl.onLeave);
    };
  }, [max, scale, disabled]);

  return { ref, glareRef };
}
