import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://week1-6m5.pages.dev',
  output: 'static',
  outDir: './dist',
  build: {
    format: 'directory'
  },
  integrations: [sitemap()]
});
