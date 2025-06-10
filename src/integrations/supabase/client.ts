
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If environment variables are not defined, use the project .env values
const fallbackUrl = 'https://qeuzosggikxwnpyhulox.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldXpvc2dnaWt4d25weWh1bG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzMwMDAsImV4cCI6MjA1OTU0OTAwMH0.6ebEh2HRX9YJlRjvKXKeybMnfnEXxfgwXbGtHhaDcQs';

export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Add connection status check
supabase.auth.onAuthStateChange((event, session) => {
  // Only log auth state changes in development
  if (import.meta.env.DEV) {
    console.log('Supabase auth state changed:', event);
  }
});
