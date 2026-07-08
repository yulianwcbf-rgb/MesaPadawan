// Backend client for the app.
//
// Picks the backend at build time:
//   - If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, uses Supabase —
//     REAL shared login + shared data across all people and devices.
//   - Otherwise falls back to the browser-local backend (data per browser),
//     so the site still works out of the box with zero configuration.
//
// Both implement the same API surface: db.auth, db.entities, db.integrations.

import { isSupabaseConfigured } from './supabase/client';
import { db as localDb } from './backend';
import { db as supabaseDb } from './supabase';

export const db = isSupabaseConfigured ? supabaseDb : localDb;
export const backendMode = isSupabaseConfigured ? 'supabase' : 'local';

if (typeof globalThis !== 'undefined') {
  globalThis.__B44_DB__ = db;
}

export { db as base44 };
export default db;
