import type { MetadataRoute } from 'next';

// Web App Manifest. Next автоматически выдаст его по адресу /manifest.webmanifest
// (file convention App Router). См. node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/01-metadata/manifest.md

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Svoy',
    short_name: 'Svoy',
    description:
      'Дневник питания, который помогает следить за едой, не разгоняя тревогу.',
    start_url: '/',
    display: 'standalone',
    background_color: '#efe8df',
    theme_color: '#efe8df',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
