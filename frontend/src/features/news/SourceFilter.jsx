import { SOURCES, SOURCE_ORDER } from './sources.js';
import styles from './SourceFilter.module.css';

/**
 * Chip group for filtering articles by source.
 * counts: { all: n, bbc: n, guardian: n, espn: n, sky: n }
 */
export default function SourceFilter({ value = 'all', onChange, counts = {}, disabled = false }) {
  const chips = [{ key: 'all', name: 'All' }, ...SOURCE_ORDER.map((k) => SOURCES[k])];

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = chips.findIndex((c) => c.key === value);
    const next = e.key === 'ArrowRight' ? (idx + 1) % chips.length : (idx - 1 + chips.length) % chips.length;
    onChange?.(chips[next].key);
    e.currentTarget.querySelector(`[data-key="${chips[next].key}"]`)?.focus();
  };

  return (
    <div className={styles.group} role="group" aria-label="Filter by source" onKeyDown={onKeyDown}>
      {chips.map((chip) => {
        const active = chip.key === value;
        const count = counts[chip.key];
        return (
          <button
            key={chip.key}
            type="button"
            data-key={chip.key}
            className={[styles.chip, active && styles.active].filter(Boolean).join(' ')}
            style={chip.color ? { '--src': chip.color, '--src-light': chip.colorLight } : undefined}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange?.(chip.key)}
          >
            {chip.key !== 'all' && <span className={styles.dot} aria-hidden="true" />}
            <span>{chip.name}</span>
            {typeof count === 'number' && (
              <span className={styles.count} aria-label={`${count} articles`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
