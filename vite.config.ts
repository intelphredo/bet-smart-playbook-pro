import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React + router in one chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library (large)
          'vendor-charts': ['recharts'],
          // UI primitives
          'vendor-radix': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          // Animation
          'vendor-motion': ['framer-motion'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-persist-client', '@tanstack/query-sync-storage-persister'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
      },
    },
    // Enable source maps for debugging, CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
}));
