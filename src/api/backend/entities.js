// Client-side entity store.
//
// Reproduces the subset of the Base44 SDK entity API that this app uses:
//   list(sort, limit), filter(query, sort, limit), get(id),
//   create(data), bulkCreate(records), update(id, data), delete(id)
//
// Every record is persisted in localStorage under a per-entity key. The API is
// async (returns Promises) to match the original SDK so no calling code needs
// to change.

import { readJSON, writeJSON, newId, nowISO } from './store';

// Default values applied on create, mirroring the Base44 entity schemas in
// /base44/entities. Keeps numeric fields numeric even when a form omits them.
const SCHEMAS = {
  TeamMember: {
    defaults: {},
  },
  WeeklyEntry: {
    defaults: {
      captacao: 0,
      consorcio: 0,
      reuniao_agendada: 0,
      reuniao_realizada: 0,
      r1: 0,
      r2: 0,
      reuniao_ip: 0,
      reuniao_ap: 0,
      pa: 0,
      receita_escritorio: 0,
      recomendacoes: 0,
      contas: 0,
      contas_totais: 0,
      patrimonio_liquido: 0,
      pipe_proxima_semana: 0,
      pipe_ip: 0,
      pipe_ap: 0,
      total_points: 0,
      breakdown: [],
    },
  },
  User: {
    defaults: { role: 'user' },
  },
};

function collectionKey(name) {
  return `entity:${name}`;
}

// Parse a Base44-style sort string: "field" (asc) or "-field" (desc).
function applySort(records, sort) {
  if (!sort) {
    // Stable-ish default: newest first by creation time.
    return [...records].sort((a, b) =>
      String(b.created_date || '').localeCompare(String(a.created_date || ''))
    );
  }
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const sorted = [...records].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return desc ? sorted.reverse() : sorted;
}

function matchesQuery(record, query) {
  return Object.entries(query || {}).every(([k, v]) => record[k] === v);
}

class Entity {
  constructor(name) {
    this.name = name;
    this.schema = SCHEMAS[name] || { defaults: {} };
  }

  _read() {
    return readJSON(collectionKey(this.name), []);
  }

  _write(records) {
    writeJSON(collectionKey(this.name), records);
  }

  async list(sort, limit) {
    const records = applySort(this._read(), sort);
    return typeof limit === 'number' ? records.slice(0, limit) : records;
  }

  async filter(query = {}, sort, limit) {
    const records = applySort(
      this._read().filter((r) => matchesQuery(r, query)),
      sort
    );
    return typeof limit === 'number' ? records.slice(0, limit) : records;
  }

  async get(id) {
    return this._read().find((r) => r.id === id) || null;
  }

  async create(data = {}) {
    const records = this._read();
    const record = {
      ...this.schema.defaults,
      ...data,
      id: newId(),
      created_date: nowISO(),
      updated_date: nowISO(),
    };
    records.push(record);
    this._write(records);
    return record;
  }

  async bulkCreate(items = []) {
    const records = this._read();
    const created = items.map((data) => ({
      ...this.schema.defaults,
      ...data,
      id: newId(),
      created_date: nowISO(),
      updated_date: nowISO(),
    }));
    records.push(...created);
    this._write(records);
    return created;
  }

  async update(id, data = {}) {
    const records = this._read();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`${this.name} ${id} não encontrado`);
    records[idx] = { ...records[idx], ...data, id, updated_date: nowISO() };
    this._write(records);
    return records[idx];
  }

  async delete(id) {
    const records = this._read();
    const next = records.filter((r) => r.id !== id);
    this._write(next);
    return { id };
  }
}

// Lazily create/cache one Entity instance per name so callers can do
// db.entities.WeeklyEntry, db.entities.TeamMember, etc.
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
