import Image from 'next/image';
import receptionBg from '../../../public/images/reception.webp';

/**
 * Full-screen photo behind the login and registration forms.
 * - 311 KB WebP (was a 5.3 MB PNG) with a built-in blurred preview, so it
 *   fades in instead of popping in after the form has appeared.
 * - Kept on its own compositor layer (transform-gpu) and with no backdrop
 *   blur on top, so scrolling the page or a dropdown doesn't repaint it.
 */
export default function AuthBackground({ alt }) {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none bg-[#2C3E50] transform-gpu">
      <Image
        src={receptionBg}
        alt={alt}
        fill
        priority
        sizes="100vw"
        quality={70}
        placeholder="blur"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#1A1A1A]/50" />
    </div>
  );
}
