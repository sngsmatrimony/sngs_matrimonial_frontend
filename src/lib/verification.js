// Verified tick = admin-approved AND ID proof verified (`idProofVerified`,
// computed server-side: an admin verified the document, or approved the
// profile with it attached). Approved profiles without that stay fully
// visible — they're just shown as not verified.
export function getVerificationState(profile) {
  if (profile?.approvalStatus !== 'approved') return null;
  return profile.idProofVerified ? 'verified' : 'notVerified';
}
