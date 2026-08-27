import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Tabs.module.css';

/**
 * items: [{ key, label, icon?: Component, count?: number }]
 */
export default function Tabs({ items, value, onChange, stretch = false, ariaLabel = 'Tabs', className }) {
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false });

  const measure = () => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('[data-active="true"]');
    if (!active) return;
    setIndicator({ x: active.offsetLeft, w: active.offsetWidth, ready: true });
    active.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  useLayoutEffect(measure, [value, items]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const onKeyDown = (e) => {
    const idx = items.findIndex((i) => i.key === value);
    if (e.key === 'ArrowRight') onChange(items[(idx + 1) % items.length].key);
    if (e.key === 'ArrowLeft') onChange(items[(idx - 1 + items.length) % items.length].key);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={[styles.tabs, stretch && styles.stretch, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDown}
    >
      <span
        className={styles.indicator}
        style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w, opacity: indicator.ready ? 1 : 0 }}
        aria-hidden="true"
      />
      {items.map(({ key, label, icon: Icon, count }) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            tabIndex={active ? 0 : -1}
            className={[styles.tab, active && styles.active].filter(Boolean).join(' ')}
            onClick={() => onChange(key)}
          >
            {Icon && <Icon size={15} />}
            {label}
            {typeof count === 'number' && <span className={styles.count}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
