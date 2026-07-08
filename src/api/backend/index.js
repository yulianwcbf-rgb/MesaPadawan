// Assembles the client-side "backend" that replaces the Base44 SDK.
//
// The original Base44 export talked to a hosted backend for auth, database
// entities and file uploads. GitHub Pages is static hosting and cannot run
// that server, so this module provides a drop-in `db` object with the same
// shape (db.auth / db.entities / db.integrations) backed entirely by the
// browser (localStorage). No configuration or external service required.

import { auth } from './auth';
import { entities } from './entities';
import { integrations } from './integrations';

export const db = { auth, entities, integrations };

// Some legacy files reference globalThis.__B44_DB__; keep it pointed at the
// real client so any such lookup resolves to the working backend.
if (typeof globalThis !== 'undefined') {
  globalThis.__B44_DB__ = db;
}

export default db;
