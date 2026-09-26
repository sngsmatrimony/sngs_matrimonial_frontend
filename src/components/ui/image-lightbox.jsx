'use client';

import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import PhotoWatermark from '@/components/ui/photo-watermark';

/**
 * Full-screen photo viewer. `index` is the open slide (or null/undefined when
 * closed); `images` is an array of { url, alt }. Controlled by the caller so
 * profile picture and gallery can each own their own lightbox state.
 * `watermarkText`, when provided, overlays a faint per-viewer watermark —
 * pass this only when viewing someone else's photos, never your own.
 */
export default function ImageLightbox({ images = [], index, onOpenChange, watermarkText = null }) {
  const open = index !== null && index !== undefined && images.length > 0;
  const total = images.length;

  const goTo = useCallback(
    (next) => {
      if (total === 0) return;
      onOpenChange(((next % total) + total) % total);
    },
    [total, onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, index, goTo]);

  if (!open) return null;
  const current = images[index];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(null)}>
      <DialogContent
        showCloseButton
        className="max-w-none w-screen h-screen sm:h-[90vh] sm:w-auto sm:max-w-[92vw] bg-black/95 border-none p-0 flex items-center justify-center rounded-none sm:rounded-2xl gap-0 [&_svg]:text-white"
      >
        <DialogTitle className="sr-only">{current?.alt || 'Photo viewer'}</DialogTitle>

        {total > 1 && (
          <button
            onClick={() => goTo(index - 1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-full pl-2 pr-3 py-2 transition-colors"
          >
            <ChevronLeft size={24} />
            <span className="hidden sm:inline font-sans text-xs">Previous</span>
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs natural-size centering, not next/image's fixed-box sizing */}
          <img
            src={current?.url}
            alt={current?.alt || 'Photo'}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <PhotoWatermark text={watermarkText} />
        </div>

        {total > 1 && (
          <button
            onClick={() => goTo(index + 1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-full pl-3 pr-2 py-2 transition-colors"
          >
            <span className="hidden sm:inline font-sans text-xs">Next</span>
            <ChevronRight size={24} />
          </button>
        )}

        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-sans text-xs bg-black/40 px-3 py-1 rounded-full">
            {index + 1} / {total}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
