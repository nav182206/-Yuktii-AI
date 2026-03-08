import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholders if missing to prevent the app from crashing on load.
// The app will function but auth will fail gracefully with an error message.
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
