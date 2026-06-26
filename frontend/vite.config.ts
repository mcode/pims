import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // load env vars from .env
const port = parseInt(process.env.PORT || '5050');
const cacheDir = process.env.VITE_CACHE_DIR || `/tmp/pims-vite-${port}`;

export default defineConfig({
  base: process.env.REACT_APP_VITE_BASE || '',
  cacheDir,
  plugins: [react()],
  preview: {
    allowedHosts: ['.mitre.org', '.elb.us-east-1.amazonaws.com'],
    port,
    host: true
  },
  define: {
    'process.env': process.env
  },
  server: {
    port,
    open: false,
    host: true,
    allowedHosts: ['.mitre.org', '.elb.us-east-1.amazonaws.com']
  }
});
