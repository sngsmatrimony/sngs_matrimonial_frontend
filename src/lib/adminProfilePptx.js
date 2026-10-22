import { adminApi } from '@/lib/api/admin';

/**
 * Download a member's profile as PPTX (admin export) — shared by the user
 * detail page and the Alliance Meet registrations list.
 */
export async function downloadProfilePptx(userId, fullName) {
  const response = await adminApi.exportUserProfilePptx(userId);
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }));
  const link = document.createElement('a');
  link.href = blobUrl;
  const safeName = (fullName || 'profile').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  link.download = `${safeName}_profile.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
