/**
 * Supabase Client — Typed client for the Deckademics Supabase project.
 *
 * Configuration is sourced exclusively from environment variables
 * (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) set in the project .env.
 * The client is typed against the auto-generated Database type so all
 * queries, inserts, and RPCs are fully type-checked.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Log auth state changes in development only
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log('Supabase auth state changed:', event);
  }
});
