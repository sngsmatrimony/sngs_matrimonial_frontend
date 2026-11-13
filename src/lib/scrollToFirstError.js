/**
 * After a form step fails its checks, bring the first field with an error
 * into view and focus it. On a phone that field is often above the fold, so
 * the member would otherwise see only the "not filled in correctly" toast.
 * Fields with an error carry aria-invalid="true" (see FormControl).
 */
export function scrollToFirstError() {
  if (typeof window === 'undefined') return;
  // Give React a moment to render the error state first.
  setTimeout(() => {
    const el = document.querySelector('[aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus?.({ preventScroll: true });
  }, 60);
}
