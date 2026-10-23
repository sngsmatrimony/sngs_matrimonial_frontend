import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

// The preview image shown when a page is shared on WhatsApp, Facebook,
// LinkedIn, X and in search results (1200×630, generated at build time).
export const alt = 'SNGS Matrimony — Malayalee & Kerala matrimony for India and NRIs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), 'public', 'logo_1.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '70px 80px', background: 'linear-gradient(135deg, #2C3E50 0%, #1A1A1A 100%)', color: '#FDF8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', background: '#FDF8F0', borderRadius: 24, padding: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders plain <img> */}
            <img src={logoSrc} width={138} height={104} alt="" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>SNGS Matrimony</div>
            <div style={{ fontSize: 26, color: '#D4A843', letterSpacing: 4, textTransform: 'uppercase' }}>Finding your perfect match</div>
          </div>
        </div>
        <div style={{ height: 4, width: 140, background: '#D4A843', margin: '44px 0 36px' }} />
        <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.2 }}>Malayalee &amp; Kerala Matrimony</div>
        <div style={{ fontSize: 34, color: '#F5E6C3', marginTop: 10 }}>For families in Kerala, across India and abroad</div>
        <div style={{ fontSize: 26, color: 'rgba(253,248,240,0.75)', marginTop: 34 }}>
          Admin-approved profiles · Phone-verified members · Open to every community
        </div>
      </div>
    ),
    size,
  );
}
