// A profile needs a profile photo and at least one gallery photo before the
// admin team can approve it (the server refuses approval without them).

/** What's missing, as phrases for a sentence — [] when the photos are complete. */
export function missingPhotoParts(user) {
  if (!user) return [];
  return [
    !user.profilePicture?.url && 'a profile photo',
    !(user.gallery?.photos || []).some((photo) => photo?.url) && 'at least one gallery photo',
  ].filter(Boolean);
}

// Opens Edit Profile straight at the photos step (read by UserProfileView).
export const ADD_PHOTOS_HREF = '/profile?addPhotos=1';
