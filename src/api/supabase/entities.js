// Supabase-backed entity store.
//
// Same entity API the app uses (list/filter/get/create/bulkCreate/update/delete)
// mapped onto Supabase/Postgres tables. All logged-in users share the same
// rows, so everyone sees the same team and weekly entries.

import { supabase } from './client';

// Entity name (used in the app) -> Postgres table name.
const TABLES = {
  TeamMember: 'team_members',
  WeeklyEntry: 'weekly_entries',
};

function tableFor(name) {
  return TABLES[name] || name.toLowerCase();
}

// Base44-style sort string: "field" (asc) or "-field" (desc).
function parseSort(sort) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  return { column: desc ? sort.slice(1) : sort, ascending: !desc };
}

function fail(error) {
  throw new Error(error?.message || 'Erro ao acessar o banco de dados.');
}

class Entity {
  constructor(name) {
    this.name = name;
    this.table = tableFor(name);
  }

  _from() {
    return supabase.from(this.table);
  }

  async list(sort, limit) {
    let q = this._from().select('*');
    const s = parseSort(sort);
    if (s) q = q.order(s.column, { ascending: s.ascending });
    if (typeof limit === 'number') q = q.limit(limit);
    const { data, error } = await q;
    if (error) fail(error);
    return data || [];
  }

  async filter(query = {}, sort, limit) {
    let q = this._from().select('*');
    Object.entries(query).forEach(([k, v]) => {
      q = q.eq(k, v);
    });
    const s = parseSort(sort);
    if (s) q = q.order(s.column, { ascending: s.ascending });
    if (typeof limit === 'number') q = q.limit(limit);
    const { data, error } = await q;
    if (error) fail(error);
    return data || [];
  }

  async get(id) {
    const { data, error } = await this._from().select('*').eq('id', id).maybeSingle();
    if (error) fail(error);
    return data || null;
  }

  async create(payload = {}) {
    const { data, error } = await this._from().insert(payload).select().single();
    if (error) fail(error);
    return data;
  }

  async bulkCreate(items = []) {
    const { data, error } = await this._from().insert(items).select();
    if (error) fail(error);
    return data || [];
  }

  async update(id, payload = {}) {
    const { data, error } = await this._from().update(payload).eq('id', id).select().single();
    if (error) fail(error);
    return data;
  }

  async delete(id) {
    const { error } = await this._from().delete().eq('id', id);
    if (error) fail(error);
    return { id };
  }
}

const cache = {};

export const entities = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== 'string') return undefined;
      if (!cache[name]) cache[name] = new Entity(name);
      return cache[name];
    },
  }
);
