'use client';

/**
 * Builds the watermark text shown to a viewer looking at someone else's
 * photos: their own email + a timestamp. Shown only to that viewer (never to
 * anyone else), so this isn't a privacy leak — it's the same pattern used by
 * document viewers (Google Docs, PDF tools) to trace a leaked copy back to
 * whoever had it open.
 */
export function buildWatermarkText(viewerUser) {
  if (!viewerUser?.email) return null;
  return `${viewerUser.email} • ${new Date().toLocaleString()}`;
}

/**
 * Faint, repeated per-viewer watermark overlaid on photos shown to OTHER
 * users (never on your own profile) — makes a leaked/screenshotted photo
 * traceable back to who viewed it. This is a deterrent + attribution layer,
 * not a security control — true screenshot blocking isn't possible on the
 * web, so this is paired with disabled right-click/selection on the photo
 * itself rather than relied on alone.
 */
export default function PhotoWatermark({ text }) {
  if (!text) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10">
      <div className="absolute inset-0 flex flex-wrap content-around justify-around opacity-[0.18]">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="text-white text-[10px] font-sans font-semibold whitespace-nowrap"
            style={{ transform: 'rotate(-28deg)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
