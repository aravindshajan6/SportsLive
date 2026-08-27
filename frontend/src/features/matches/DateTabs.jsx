import { useEffect, useMemo, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { addDays, toISODate } from '@/lib/format.js';
import { chipLabel, dateLabel } from './dateLabels.js';
import styles from './DateTabs.module.css';

/**
 * Horizontal day chips (-3..+3) + native date picker.
 * @param {{ value: string, onChange: (iso: string) => void }} props
 */
export default function DateTabs({ value, onChange }) {
  const stripRef = useRef(null);
  const today = toISODate();

  const days = useMemo(() => {
    const base = new Date(`${today}T12:00:00`);
    const list = [];
    for (let offset = -3; offset <= 3; offset += 1) {
      const d = addDays(base, offset);
      list.push({ iso: toISODate(d), label: chipLabel(d, offset), offset });
    }
    return list;
  }, [today]);

  const chips = useMemo(() => {
    if (!value || days.some((d) => d.iso === value)) return days;
    const extra = { iso: value, label: dateLabel(value), offset: value < today ? -99 : 99 };
    return value < today ? [extra, ...days] : [...days, extra];
  }, [days, value, today]);

  // keep the selected chip in view
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector('[aria-current="date"]');
    if (!strip || !el) return;
    const left = el.offsetLeft - strip.clientWidth / 2 + el.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [value, chips]);

  return (
    <div className={styles.wrap}>
      <div ref={stripRef} className={styles.strip} role="group" aria-label="Choose a day">
        {chips.map((d) => {
          const selected = d.iso === value;
          return (
            <button
              key={d.iso}
              type="button"
              className={[styles.chip, selected && styles.selected, d.offset === 0 && styles.today].filter(Boolean).join(' ')}
              aria-current={selected ? 'date' : undefined}
              onClick={() => onChange(d.iso)}
            >
              {d.offset === 0 && <span className={styles.todayDot} aria-hidden="true" />}
              {d.label}
            </button>
          );
        })}
      </div>
      <label className={[styles.picker, !chips.some((d) => d.iso === value) && styles.selected].filter(Boolean).join(' ')}>
        <CalendarDays size={16} aria-hidden="true" />
        <span className="visually-hidden">Pick a date</span>
        <input
          type="date"
          className={styles.input}
          value={value || today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
