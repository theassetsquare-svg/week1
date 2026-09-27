import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dd.nolcool.com',
  base: '/',
  output: 'static',
  outDir: './dist',
  build: {
    format: 'directory'
  }
});
