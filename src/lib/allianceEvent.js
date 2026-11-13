// The Alliance Meet day is a calendar date ("YYYY-MM-DD", no time zone), so
// it's formatted from its parts — never through the viewer's time zone,
// which could move it to the day before.

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parts(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ''));
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day, weekday: d.getUTCDay() };
}

/** "Sunday, 24 January 2027", or '' for a missing/invalid date. */
export function formatEventDate(ymd) {
  const p = parts(ymd);
  return p ? `${DAYS[p.weekday]}, ${p.day} ${MONTHS[p.month - 1]} ${p.year}` : '';
}

/** True until the event day is over in India (where the event is held). */
export function isUpcomingEvent(ymd, now = new Date()) {
  if (!parts(ymd)) return false;
  const todayInIndia = new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
  return ymd >= todayInIndia;
}
