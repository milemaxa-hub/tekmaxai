// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tekmaxai.com',
  integrations: [tailwind(), mdx(), sitemap()],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
  vite: {
    server: {
      host: '0.0.0.0',
      port: 4321,
      allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
      hmr: {
        clientPort: 4321,
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4321,
      allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    },
  },
});
