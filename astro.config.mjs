import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://parceirostonmanaus.com.br',
  integrations: [tailwind()],
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
  server: { host: true, port: 4321 }
});
