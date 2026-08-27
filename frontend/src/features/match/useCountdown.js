import { useEffect, useState } from 'react';
import { formatDateTime, toDate } from '@/lib/format.js';

const DAY = 24 * 60 * 60 * 1000;

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Countdown to a kickoff time.
 * Ticks every second only while the kickoff is less than 24h away (and still in the future).
 * @returns {{ ms: number, isSoon: boolean, isPast: boolean, text: string }}
 */
export function useCountdown(target) {
  const targetMs = toDate(target)?.getTime() ?? null;
  const [now, setNow] = useState(() => Date.now());

  const ms = targetMs === null ? 0 : targetMs - now;
  const isSoon = targetMs !== null && ms > 0 && ms < DAY;

  useEffect(() => {
    if (!isSoon) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isSoon]);

  let text = '';
  if (targetMs === null) text = '';
  else if (ms <= 0) text = 'Kicking off';
  else if (isSoon) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    text = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  } else {
    const days = Math.floor(ms / DAY);
    text = days === 1 ? 'Tomorrow' : `in ${days} days`;
  }

  return { ms, isSoon, isPast: targetMs !== null && ms <= 0, text, dateText: targetMs ? formatDateTime(targetMs) : '' };
}
