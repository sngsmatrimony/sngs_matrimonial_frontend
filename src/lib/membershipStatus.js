/** The plan's id whether `membership.planId` is populated or a bare id. */
export function planIdOf(membership) {
  const p = membership?.planId;
  if (!p) return null;
  return typeof p === 'object' ? p._id : p;
}

/**
 * Free credits from an Alliance Meet registration — no plan bought. They
 * never expire; once used up the member is without a plan (isActive false),
 * and buying a plan replaces them with any leftover credits added.
 */
export function isOnFreeCredits(membership) {
  return membership?.source === 'alliance';
}

/** On Alliance Meet free credits with some left. */
export function hasFreeCreditsLeft(membership) {
  return isOnFreeCredits(membership) && !!membership?.isActive;
}

/** Alliance Meet free credits all spent — they need a plan now. */
export function freeCreditsUsedUp(membership) {
  return isOnFreeCredits(membership) && !membership?.isActive;
}

/**
 * The member had a plan and it has ended. Covers both moments: just past the
 * end date (isActive still true, isExpired true) and after the expiry job has
 * reset it (isActive false, planId kept). Expiry is the only thing that turns
 * a plan off, so this means "expired". (Used-up free credits aren't a lapsed
 * plan: there's nothing to renew — see freeCreditsUsedUp.)
 */
export function isPlanLapsed(membership) {
  return !isOnFreeCredits(membership) && !!planIdOf(membership) && !(membership?.isActive && !membership?.isExpired);
}
