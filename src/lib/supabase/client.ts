import { createClient } from '@supabase/supabase-js';
import { env } from '../env';
import type { Database } from '@/types/database';

/**
 * Global Supabase Client instance for the browser.
 * Strongly typed with generated database schema.
 * Uses public publishable key only (Row Level Security protected).
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
