/** The plan's id whether `membership.planId` is populated or a bare id. */
export function planIdOf(membership) {
  const p = membership?.planId;
  if (!p) return null;
  return typeof p === 'object' ? p._id : p;
}

/**
 * The member had a plan and it has ended. Covers both moments: just past the
 * end date (isActive still true, isExpired true) and after the expiry job has
 * reset it (isActive false, planId kept). Expiry is the only thing that turns
 * a plan off, so this means "expired".
 */
export function isPlanLapsed(membership) {
  return !!planIdOf(membership) && !(membership?.isActive && !membership?.isExpired);
}
