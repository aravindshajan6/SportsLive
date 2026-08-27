// Thin helpers around anime.js v4 so every feature animates the same way.
import { animate, createScope, createTimeline, spring, stagger, utils } from 'animejs';

export { animate, createScope, createTimeline, spring, stagger, utils };
/** Back-compat alias — anime 4.5 deprecated createSpring in favour of spring(). */
export const createSpring = spring;

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Mark the document as animation-capable (utilities.css hides [data-reveal] only when this class exists). */
export function enableJsAnimations() {
  if (typeof document === 'undefined') return;
  if (prefersReducedMotion()) {
    document.documentElement.classList.remove('js-anim');
    return;
  }
  document.documentElement.classList.add('js-anim');
}

/** Safety net: make sure targets are visible even if an animation throws. */
export function ensureVisible(targets) {
  try {
    utils.set(targets, { opacity: 1, translateY: 0, translateX: 0, scale: 1 });
  } catch {
    /* ignore */
  }
}

/** Fade-and-rise reveal for a list of elements. */
export function revealUp(targets, { delay = 0, step = 70, duration = 800, distance = 24 } = {}) {
  if (prefersReducedMotion()) {
    ensureVisible(targets);
    return null;
  }
  return animate(targets, {
    opacity: [0, 1],
    translateY: [distance, 0],
    duration,
    delay: stagger(step, { start: delay }),
    ease: 'outExpo',
  });
}

/** Scale-in pop for cards/badges. */
export function popIn(targets, { delay = 0, step = 50, duration = 600 } = {}) {
  if (prefersReducedMotion()) {
    ensureVisible(targets);
    return null;
  }
  return animate(targets, {
    opacity: [0, 1],
    scale: [0.92, 1],
    duration,
    delay: stagger(step, { start: delay }),
    ease: 'outBack(1.4)',
  });
}

/** Animate a numeric counter on an element's textContent. */
export function countUp(el, to, { from = 0, duration = 900, format = (v) => Math.round(v) } = {}) {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return null;
  }
  const obj = { v: from };
  return animate(obj, {
    v: to,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      el.textContent = format(obj.v);
    },
  });
}

/** Springy pointer-parallax: returns {onMove, onLeave} handlers for a 3D tilt effect. */
export function createTiltController(el, { max = 12, scale = 1.02, glare = null } = {}) {
  if (!el) return { onMove() {}, onLeave() {} };
  const ease = spring({ stiffness: 120, damping: 14 });
  let current = null;
  const run = (rx, ry, s) => {
    if (prefersReducedMotion()) return;
    current?.pause();
    current = animate(el, { rotateX: rx, rotateY: ry, scale: s, ease, duration: 600 });
  };
  return {
    onMove(e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      run(-py * max, px * max, scale);
      if (glare) {
        glare.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
        glare.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
        glare.style.opacity = '1';
      }
    },
    onLeave() {
      run(0, 0, 1);
      if (glare) glare.style.opacity = '0';
    },
  };
}
