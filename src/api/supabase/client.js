// Supabase client.
//
// Supabase is a hosted backend (Postgres + Auth) that works alongside a static
// GitHub Pages frontend, giving REAL shared login and shared data across every
// person and device. It activates only when both env vars are provided; if
// they are missing the app automatically falls back to the browser-local
// backend (see ../backend). The URL and anon key are public values and safe to
// ship in the frontend.

import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
