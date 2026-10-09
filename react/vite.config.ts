import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    tsconfigPaths: true,
  },

  // Windows: localhost может не открываться — резолвится в IPv6 ::1 вместо 127.0.0.1
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
});
