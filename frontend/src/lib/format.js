// Date / status / number formatting helpers shared across features.

export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD in the *local* timezone (used for date tabs). */
export function toISODate(date = new Date()) {
  const d = toDate(date) ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date, days) {
  const d = new Date(toDate(date) ?? new Date());
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a, b) {
  const x = toDate(a);
  const y = toDate(b);
  if (!x || !y) return false;
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function formatTime(value, opts = {}) {
  const d = toDate(value);
  if (!d) return '--:--';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', ...opts }).format(d);
}

export function formatDate(value, opts = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(d);
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** "Today", "Yesterday", "Tomorrow" or a short date. */
export function relativeDayLabel(value) {
  const d = toDate(value);
  if (!d) return '';
  const today = new Date();
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, addDays(today, -1))) return 'Yesterday';
  if (isSameDay(d, addDays(today, 1))) return 'Tomorrow';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

/** "3m ago", "2h ago", "yesterday", or a date. */
export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const s = Math.round(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/** Short status used on cards: minute for live matches, HT/FT, or kickoff time. */
export function matchStatusText(match) {
  if (!match) return '';
  if (match.isLive) return match.status === 'HT' ? 'HT' : match.statusLabel || match.status;
  if (match.phase === 'finished') return match.status === 'FT' ? 'FT' : match.status;
  if (match.phase === 'postponed') return 'Postponed';
  if (match.phase === 'abandoned') return 'Abandoned';
  if (match.phase === 'cancelled') return 'Cancelled';
  return formatTime(match.startTime);
}

export function scoreText(match) {
  if (!match) return '';
  if (match.homeScore === null || match.homeScore === undefined) return '–';
  return `${match.homeScore} – ${match.awayScore}`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
