// Files chosen in a file picker are read again only when they're uploaded.
// On Android, a photo picked from the gallery can become unreadable by then
// (e.g. after 20+ minutes on the email step): Chrome fails the upload before
// sending anything, after the account already exists. So every picked file
// is copied into memory the moment it's chosen.

// Photos are also resized and re-saved as JPEG: a 3-5 MB camera photo uploads
// slowly on mobile data, and re-saving drops the photo's hidden details
// (EXIF), including the GPS location many phones record. 2048 px at quality
// 0.88 measured visually identical to the original at every size the site
// shows photos (search card, phone and laptop full-screen), at ~300-650 KB.
const MAX_PHOTO_EDGE = 2048;
const PHOTO_QUALITY = 0.88;
// Already small enough: re-saved only to drop EXIF, so keep more quality.
const PHOTO_QUALITY_UNRESIZED = 0.92;
// Originals can be large (high-megapixel modes); they're shrunk before upload.
const MAX_ORIGINAL_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // server limit
const SMALL_PHOTO_EDGE = 600;

export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PHOTO_FORMATS_HINT = 'JPG, PNG or WebP. Large photos are resized automatically.';
export const UNREADABLE_FILE_MESSAGE = "We couldn't read that file from your device. Please choose it again.";

/** A photo the member needs to replace; `message` is safe to show as-is. */
export class PhotoError extends Error {}

/** Copy a picked file into memory. Throws if the device won't let us read it. */
export async function keepFileInMemory(file) {
  const bytes = await file.arrayBuffer();
  return new File([bytes], file.name, { type: file.type, lastModified: file.lastModified });
}

const extensionOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
const isHeic = (file) => /image\/hei[cf]/i.test(file.type) || ['heic', 'heif'].includes(extensionOf(file.name));
const isSupportedType = (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  || (!file.type && ['jpg', 'jpeg', 'png', 'webp'].includes(extensionOf(file.name)));

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Older browsers: fall back to an <img> below.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

/**
 * Copy a picked photo into memory as a JPEG no larger than 2048 px on its
 * longest side. Resolves to { file, width, height, small } — `small` when the
 * photo is likely to look blurry. Throws PhotoError with a message to show.
 */
export async function preparePhoto(picked) {
  const name = picked.name || 'photo';
  const heic = isHeic(picked);
  if (!heic && !isSupportedType(picked)) {
    throw new PhotoError(`"${name}" isn't a photo we can use. Please choose a JPG or PNG photo.`);
  }
  if (picked.size > MAX_ORIGINAL_PHOTO_BYTES) {
    throw new PhotoError(`"${name}" is larger than 25 MB. Please choose a smaller photo.`);
  }

  let original;
  try {
    original = await keepFileInMemory(picked);
  } catch {
    throw new PhotoError(UNREADABLE_FILE_MESSAGE);
  }

  let decoded;
  try {
    decoded = await decodeImage(original);
  } catch {
    if (heic) {
      throw new PhotoError(`"${name}" is an HEIC photo, which this browser can't open. Please choose a JPG photo, or set your camera to save photos as JPG ("Most Compatible").`);
    }
    throw new PhotoError(original.size > MAX_UPLOAD_BYTES
      ? `"${name}" is too large for your device to process. Please choose a smaller photo.`
      : `We couldn't open "${name}" — the file may be damaged. Please choose a different photo.`);
  }

  const { source, width, height, release } = decoded;
  const small = Math.max(width, height) < SMALL_PHOTO_EDGE;
  try {
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    // The default ('low') visibly softens large reductions.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // JPEG has no transparency: give transparent PNGs a white background, not black.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', scale < 1 ? PHOTO_QUALITY : PHOTO_QUALITY_UNRESIZED);
    });
    if (blob) {
      const file = new File([blob], `${name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      return { file, width: canvas.width, height: canvas.height, small };
    }
  } catch {
    // Fall through to the unchanged copy below.
  } finally {
    release();
  }

  // Re-saving failed (rare, e.g. out of memory): the unchanged copy still
  // works if the server accepts it as it is.
  if (['image/jpeg', 'image/png'].includes(original.type) && original.size <= MAX_UPLOAD_BYTES) {
    return { file: original, width, height, small };
  }
  throw new PhotoError(`We couldn't prepare "${name}" for upload. Please choose a different photo.`);
}
