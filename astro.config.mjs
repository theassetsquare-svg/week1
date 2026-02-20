import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://night-4qy.pages.dev',
  output: 'static',
  outDir: './dist',
  build: {
    format: 'directory'
  }
});
