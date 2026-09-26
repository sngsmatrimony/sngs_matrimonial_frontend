import { redirect } from 'next/navigation';

// This standalone route is unused (no links point here) and predates the
// dashboard shell. The real chat entry point is /messages, inside the
// dashboard layout (nav, ApprovalGuard, etc).
export default function LegacyChatRedirect() {
  redirect('/messages');
}
