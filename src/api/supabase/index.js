// Assembles the Supabase-backed db (auth + entities). File uploads reuse the
// in-browser image downscaling from the local backend and store the resulting
// data URL directly in the shared table row, so no Storage bucket setup is
// required and every user sees the photo.

import { auth } from './auth';
import { entities } from './entities';
import { integrations } from '../backend/integrations';

export const db = { auth, entities, integrations };

export default db;
