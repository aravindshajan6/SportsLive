// Day-chip labels shared by DateTabs and MatchesPage.
import { toISODate } from '@/lib/format.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today" / "Yesterday" / "Tomorrow" or "Thu 28 Aug". */
export function chipLabel(d, offset) {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Full label for a YYYY-MM-DD string. */
export function dateLabel(iso) {
  const today = toISODate();
  if (iso === today) return 'Today';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Math.round((d - new Date(`${today}T12:00:00`)) / 86_400_000);
  return chipLabel(d, diff);
}
