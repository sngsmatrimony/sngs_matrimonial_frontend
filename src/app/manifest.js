// Web app manifest: name, colours and icon when the site is saved to a
// phone's home screen (and a quality signal for search engines).
export default function manifest() {
  return {
    name: 'SNGS Matrimony',
    short_name: 'SNGS Matrimony',
    description: 'Malayalee matrimony for families in Kerala, across India and abroad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F0',
    theme_color: '#2C3E50',
    icons: [
      { src: '/icon.png', sizes: '518x390', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '518x390', type: 'image/png' },
    ],
  };
}
