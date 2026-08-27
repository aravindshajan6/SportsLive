import { useEffect, useRef } from 'react';
import { animate, stagger, utils, prefersReducedMotion } from '@/lib/anim.js';

/**
 * Scroll reveal for children marked with [data-reveal] inside the returned ref's element
 * (or the element itself if it carries data-reveal). Uses IntersectionObserver + anime.js.
 * Re-runs when `deps` change (e.g. after data loads).
 */
export function useReveal(deps = [], { step = 70, distance = 24, duration = 800, threshold = 0.12 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.matches?.('[data-reveal]')
      ? [root]
      : Array.from(root.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    if (!targets.length) return undefined;

    const reveal = (els) => {
      els.forEach((el) => el.classList.add('is-revealed'));
      if (prefersReducedMotion() || !document.documentElement.classList.contains('js-anim')) {
        utils.set(els, { opacity: 1, translateY: 0 });
        return;
      }
      animate(els, {
        opacity: [0, 1],
        translateY: [distance, 0],
        duration,
        delay: stagger(step),
        ease: 'outExpo',
      });
    };

    if (!('IntersectionObserver' in window)) {
      reveal(targets);
      return undefined;
    }

    const pending = new Set(targets);
    const io = new IntersectionObserver(
      (entries) => {
        const batch = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting && pending.has(entry.target)) {
            pending.delete(entry.target);
            io.unobserve(entry.target);
            batch.push(entry.target);
          }
        });
        if (batch.length) reveal(batch);
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach((el) => io.observe(el));

    // Safety: never leave anything hidden for more than a few seconds.
    const timer = setTimeout(() => {
      if (pending.size) reveal(Array.from(pending));
      pending.clear();
    }, 4000);

    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
