'use client';

import { Suspense } from 'react';
import UserProfileView from '@/components/profile/UserProfileView';

export default function ProfilePage() {
  // Suspense: UserProfileView reads the URL (?addPhotos=1) via useSearchParams.
  return (
    <Suspense fallback={null}>
      <UserProfileView />
    </Suspense>
  );
}
