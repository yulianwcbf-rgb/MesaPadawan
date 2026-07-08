// Low-level persistent storage for the client-side backend.
//
// GitHub Pages only serves static files — there is no server to run a database.
// So the "backend" lives entirely in the browser and persists data in
// localStorage. This module is the storage primitive used by the entity and
// auth layers.

const PREFIX = 'mesa_padawan';

const hasLocalStorage = (() => {
  try {
    const k = `${PREFIX}__test`;
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

// In-memory fallback so the app still runs (for the current session) even when
// localStorage is unavailable (e.g. private mode with storage disabled).
const memory = new Map();

function rawGet(key) {
  if (hasLocalStorage) return window.localStorage.getItem(key);
  return memory.has(key) ? memory.get(key) : null;
}

function rawSet(key, value) {
  if (hasLocalStorage) {
    window.localStorage.setItem(key, value);
    return;
  }
  memory.set(key, value);
}

function rawRemove(key) {
  if (hasLocalStorage) {
    window.localStorage.removeItem(key);
    return;
  }
  memory.delete(key);
}

export function readJSON(key, fallback) {
  const raw = rawGet(`${PREFIX}:${key}`);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    rawSet(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch (err) {
    // Most likely a quota error. Surface it so callers can show a message.
    throw new Error(
      'Não foi possível salvar os dados no navegador (armazenamento cheio). ' +
        'Remova fotos grandes ou lançamentos antigos e tente novamente.'
    );
  }
}

export function removeKey(key) {
  rawRemove(`${PREFIX}:${key}`);
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO() {
  return new Date().toISOString();
}
