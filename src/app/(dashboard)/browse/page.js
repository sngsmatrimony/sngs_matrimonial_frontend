'use client';

import { Suspense } from 'react';
import BrowseProfiles from '@/components/profile/BrowseProfiles';

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseProfiles />
    </Suspense>
  );
}
