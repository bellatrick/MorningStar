
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration is executed in a Node.js environment where 'process' is a global object.
// Removing the explicit import of 'process' from 'node:process' avoids potential type conflicts
// with global type definitions (like @types/node) and browser-side polyfills.
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any because the Process type definition might be incomplete in this environment
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
