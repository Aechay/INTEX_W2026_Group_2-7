import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

const LOCAL_API_BASE_URL = "https://localhost:7229";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/auth': {
        target: LOCAL_API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: LOCAL_API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
      // Minimal APIs (e.g. /donor/donations) — must match backend route prefixes
      '/donor': {
        target: LOCAL_API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@tanstack/query-core',
    ],
  },
}));
