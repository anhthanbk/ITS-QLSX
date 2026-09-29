import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Global Supabase Client instance for the browser.
 * Uses public publishable key only (Row Level Security protected).
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
