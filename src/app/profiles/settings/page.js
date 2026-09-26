import { redirect } from 'next/navigation';

// Old URL, kept for anyone with a bookmark/link. The real settings page now
// lives at /settings, inside the dashboard shell (nav, ApprovalGuard, etc).
export default function LegacySettingsRedirect() {
  redirect('/settings');
}
