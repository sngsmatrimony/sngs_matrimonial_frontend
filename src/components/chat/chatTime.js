// Date/time labels for the chat UI (Indian English formatting).

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "1:34 pm" */
export function formatMessageTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Whole calendar days between a date and today (0 = today). */
function daysAgo(d) {
  return Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
}

/** Conversation list: "1:34 pm" today, "Yesterday", "Mon" this week, else "12 Oct". */
export function formatListTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const diff = daysAgo(d);
  if (diff <= 0) return formatMessageTime(d);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** Separator between days in a conversation: "Today", "Yesterday", "Monday, 12 Oct 2026". */
export function formatDayLabel(value) {
  const d = toDate(value);
  if (!d) return '';
  const diff = daysAgo(d);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

export function isSameDay(a, b) {
  const da = toDate(a);
  const db = toDate(b);
  return !!da && !!db && startOfDay(da).getTime() === startOfDay(db).getTime();
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').substring(0, 2).toUpperCase();
}

/** Message sender id as a string, whether populated or not. */
export function senderIdOf(message) {
  const s = message?.senderId;
  return (typeof s === 'object' && s !== null ? s._id : s)?.toString() ?? '';
}
