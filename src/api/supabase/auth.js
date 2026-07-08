// Supabase-backed authentication.
//
// Implements the same auth surface the app calls (register, login, me, logout,
// password reset) using Supabase Auth, so accounts are shared across everyone.

import { supabase } from './client';

function toUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || (u.email ? u.email.split('@')[0] : ''),
    role: u.user_metadata?.role || u.app_metadata?.role || 'user',
  };
}

function friendly(message) {
  const m = String(message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email ou senha inválidos.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Já existe uma conta com esse email.';
  }
  if (m.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar (verifique sua caixa de entrada).';
  }
  return message || 'Ocorreu um erro.';
}

function authError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const auth = {
  async register({ email, password, full_name } = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: full_name || undefined } },
    });
    if (error) throw authError(friendly(error.message), 400);
    // With email confirmation disabled (recommended), a session is returned and
    // the user is logged in immediately. Otherwise they must confirm by email.
    if (!data.session) {
      throw authError(
        'Conta criada! Confirme seu email para entrar. (Dica: desative "Confirm email" no Supabase para entrar direto.)',
        200
      );
    }
    return toUser(data.user);
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw authError(friendly(error.message), 401);
    return toUser(data.user);
  },

  async loginWithProvider() {
    throw authError('Login com provedor externo não está configurado.', 501);
  },

  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw authError('Não autenticado.', 401);
    return toUser(data.user);
  },

  async isAuthenticated() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  setToken() {
    /* Supabase manages its own session token. */
  },

  async logout() {
    await supabase.auth.signOut();
  },

  // Kept for API compatibility; Supabase accounts don't use an app-level OTP.
  async verifyOtp() {
    return {};
  },
  async resendOtp() {
    return {};
  },

  // Sends a password-reset email. The link returns to the app's reset page.
  async resetPasswordRequest(email) {
    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Return no local token: the UI then shows the "check your email" message.
    return { token: null, emailed: !error };
  },

  async resetPassword({ newPassword } = {}) {
    // After clicking the email link, Supabase establishes a recovery session,
    // so updating the user's password here applies the reset.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(friendly(error.message), 400);
    return { ok: true };
  },
};
