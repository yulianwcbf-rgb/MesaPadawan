// Client-side authentication.
//
// GitHub Pages can't run a login server, so authentication happens in the
// browser: accounts (email + salted password hash) live in localStorage and a
// "session token" is just the id of the logged-in user. This reproduces the
// subset of the Base44 auth SDK the app calls.
//
// Security note: this is browser-local auth suitable for an internal team
// dashboard. Anyone with access to the browser profile can read localStorage,
// so do not store sensitive data here. For cross-device shared accounts you
// would plug in a real backend (see README).

import { readJSON, writeJSON, removeKey, newId, nowISO } from './store';

const USERS_KEY = 'users';
const TOKEN_KEY = 'session_token';
const RESET_KEY = 'reset_tokens';

const env = import.meta.env || {};
const DEFAULT_ADMIN = {
  email: (env.VITE_ADMIN_EMAIL || 'admin@mesa.local').toLowerCase(),
  password: env.VITE_ADMIN_PASSWORD || 'admin123',
  full_name: 'Administrador',
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// SHA-256(salt:password) as hex. Falls back to a simple hash if the Web Crypto
// SubtleCrypto API is unavailable (non-secure context). GitHub Pages is https,
// so the strong path is used in production.
async function hashPassword(password, salt) {
  const material = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(material);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 0;
  for (let i = 0; i < material.length; i += 1) {
    h = (h << 5) - h + material.charCodeAt(i);
    h |= 0;
  }
  return `weak_${(h >>> 0).toString(16)}`;
}

function readUsers() {
  return readJSON(USERS_KEY, []);
}

function writeUsers(users) {
  writeJSON(USERS_KEY, users);
}

function sanitize(user) {
  if (!user) return null;
  const { salt, hash, ...safe } = user;
  return safe;
}

function setSessionToken(userId) {
  writeJSON(TOKEN_KEY, userId);
  try {
    // Mirror to the key legacy app-params helpers look for. Harmless if unused.
    window.localStorage.setItem('base44_access_token', userId || '');
  } catch {
    /* ignore */
  }
}

function clearSessionToken() {
  removeKey(TOKEN_KEY);
  try {
    window.localStorage.removeItem('base44_access_token');
  } catch {
    /* ignore */
  }
}

function getSessionUserId() {
  return readJSON(TOKEN_KEY, null);
}

// Create the default admin account once, so a freshly deployed site can be
// used immediately with documented credentials.
let seedPromise = null;
async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const users = readUsers();
    if (users.length > 0) return;
    const salt = newId();
    const hash = await hashPassword(DEFAULT_ADMIN.password, salt);
    writeUsers([
      {
        id: newId(),
        email: DEFAULT_ADMIN.email,
        full_name: DEFAULT_ADMIN.full_name,
        role: 'admin',
        salt,
        hash,
        created_date: nowISO(),
      },
    ]);
  })();
  return seedPromise;
}

function authError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const auth = {
  async register({ email, password, full_name } = {}) {
    await ensureSeeded();
    const normEmail = normalizeEmail(email);
    if (!normEmail || !password) {
      throw authError('Informe email e senha.', 400);
    }
    if (String(password).length < 6) {
      throw authError('A senha deve ter pelo menos 6 caracteres.', 400);
    }
    const users = readUsers();
    if (users.some((u) => u.email === normEmail)) {
      throw authError('Já existe uma conta com esse email.', 409);
    }
    const salt = newId();
    const hash = await hashPassword(password, salt);
    const user = {
      id: newId(),
      email: normEmail,
      full_name: full_name || normEmail.split('@')[0],
      // First account ever created is the admin; the rest are regular users.
      role: users.length === 0 ? 'admin' : 'user',
      salt,
      hash,
      created_date: nowISO(),
    };
    users.push(user);
    writeUsers(users);
    setSessionToken(user.id); // auto-login after registration
    return sanitize(user);
  },

  async loginViaEmailPassword(email, password) {
    await ensureSeeded();
    const normEmail = normalizeEmail(email);
    const users = readUsers();
    const user = users.find((u) => u.email === normEmail);
    if (!user) throw authError('Email ou senha inválidos.', 401);
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) throw authError('Email ou senha inválidos.', 401);
    setSessionToken(user.id);
    return sanitize(user);
  },

  // Provider login (Google, etc.) needs a real OAuth backend, which a static
  // GitHub Pages deployment can't provide. Kept so any caller fails clearly.
  async loginWithProvider() {
    throw authError(
      'Login com provedor externo não está disponível nesta versão. Use email e senha.',
      501
    );
  },

  async me() {
    await ensureSeeded();
    const id = getSessionUserId();
    if (!id) throw authError('Não autenticado.', 401);
    const user = readUsers().find((u) => u.id === id);
    if (!user) {
      clearSessionToken();
      throw authError('Sessão expirada.', 401);
    }
    return sanitize(user);
  },

  async isAuthenticated() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  setToken(token) {
    setSessionToken(token);
  },

  logout() {
    clearSessionToken();
  },

  // OTP email verification isn't possible without a mail server; accounts are
  // active immediately on registration. These exist for API compatibility.
  async verifyOtp() {
    const id = getSessionUserId();
    return { access_token: id };
  },
  async resendOtp() {
    return { ok: true };
  },

  // Password reset: without a mail server we can't email a link, so we mint a
  // token locally and hand it back to the UI, which opens the reset page.
  async resetPasswordRequest(email) {
    await ensureSeeded();
    const normEmail = normalizeEmail(email);
    const users = readUsers();
    const user = users.find((u) => u.email === normEmail);
    if (!user) return { token: null };
    const token = newId();
    const resets = readJSON(RESET_KEY, {});
    resets[token] = { email: normEmail, created_date: nowISO() };
    writeJSON(RESET_KEY, resets);
    return { token };
  },

  async resetPassword({ resetToken, newPassword } = {}) {
    if (!resetToken) throw authError('Link de redefinição inválido.', 400);
    if (String(newPassword || '').length < 6) {
      throw authError('A senha deve ter pelo menos 6 caracteres.', 400);
    }
    const resets = readJSON(RESET_KEY, {});
    const entry = resets[resetToken];
    if (!entry) throw authError('Link de redefinição inválido ou expirado.', 400);
    const users = readUsers();
    const user = users.find((u) => u.email === entry.email);
    if (!user) throw authError('Conta não encontrada.', 404);
    user.salt = newId();
    user.hash = await hashPassword(newPassword, user.salt);
    user.updated_date = nowISO();
    writeUsers(users);
    delete resets[resetToken];
    writeJSON(RESET_KEY, resets);
    return { ok: true };
  },
};
