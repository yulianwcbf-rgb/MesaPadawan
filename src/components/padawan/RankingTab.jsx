import { db } from '@/api/base44Client';

import React, { useState, useEffect, useMemo } from 'react';

import { fmtPts, fmtMonthBR, fmtDateBR } from '@/lib/scoring';
import MemberAvatar from '@/components/padawan/MemberAvatar';
import { motion } from 'framer-motion';

const RANK_TABS = [
  { key: 'geral', label: 'Geral' },
  { key: 'mensal', label: 'Mensal' },
  { key: 'semanal', label: 'Semanal' },
];

export default function RankingTab() {
  const [entries, setEntries] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('geral');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  useEffect(() => {
    async function load() {
      const [e, t] = await Promise.all([
        db.entities.WeeklyEntry.list(),
        db.entities.TeamMember.list()
      ]);
      setEntries(e);
      setTeam(t);
      setLoading(false);
    }
    load();
  }, []);

  // Available months (YYYY-MM) and weeks (YYYY-MM-DD), most recent first.
  const months = useMemo(() => {
    const set = new Set(entries.map(e => (e.week_start || '').slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [entries]);

  const weeks = useMemo(() => {
    const set = new Set(entries.map(e => e.week_start).filter(Boolean));
    return [...set].sort().reverse();
  }, [entries]);

  // Default the selectors to the most recent period once data is loaded.
  useEffect(() => {
    if (months.length && !selectedMonth) setSelectedMonth(months[0]);
  }, [months, selectedMonth]);
  useEffect(() => {
    if (weeks.length && !selectedWeek) setSelectedWeek(weeks[0]);
  }, [weeks, selectedWeek]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#224030] border-t-[#A8E063] rounded-full animate-spin" />
      </div>
    );
  }

  const photoMap = {};
  team.forEach(m => { photoMap[m.name] = m; });

  // Entries relevant to the selected ranking mode.
  const filtered = mode === 'mensal'
    ? entries.filter(e => (e.week_start || '').slice(0, 7) === selectedMonth)
    : mode === 'semanal'
      ? entries.filter(e => e.week_start === selectedWeek)
      : entries;

  const totals = {};
  team.forEach(m => { totals[m.name] = 0; });
  filtered.forEach(e => {
    totals[e.assessor] = (totals[e.assessor] || 0) + (e.total_points || 0);
  });

  const arr = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...arr.map(a => Math.abs(a[1])));

  const noTeam = team.length === 0 && entries.length === 0;

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      {/* Sub-tabs: Geral / Mensal / Semanal */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1">
          {RANK_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={`font-mono text-xs tracking-wide px-3.5 py-2 rounded-md border transition-colors ${
                mode === t.key
                  ? 'bg-[#A8E063] text-[#0A1F16] border-[#A8E063]'
                  : 'text-[#8FA897] border-[#224030] hover:text-[#F3F6F1]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector for Mensal / Semanal */}
        {mode === 'mensal' && months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="field-input ml-auto"
            style={{ width: 'auto' }}
          >
            {months.map(m => <option key={m} value={m}>{fmtMonthBR(m)}</option>)}
          </select>
        )}
        {mode === 'semanal' && weeks.length > 0 && (
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            className="field-input ml-auto"
            style={{ width: 'auto' }}
          >
            {weeks.map(w => <option key={w} value={w}>Semana de {fmtDateBR(w)}</option>)}
          </select>
        )}
      </div>

      {noTeam ? (
        <div className="p-8 text-center text-sm text-[#8FA897]">
          Nenhum assessor cadastrado ainda. Vá em <span className="text-[#F3F6F1] font-semibold">Equipe</span> para adicionar.
        </div>
      ) : mode === 'mensal' && months.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#8FA897]">Nenhum lançamento registrado ainda.</div>
      ) : mode === 'semanal' && weeks.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#8FA897]">Nenhum lançamento registrado ainda.</div>
      ) : (
        <div className="flex flex-col gap-0">
          {arr.map(([name, pts], i) => {
            const pct = Math.max(3, Math.min(100, (Math.abs(pts) / max) * 100));
            const isFirst = i === 0 && pts > 0;
            const isNeg = pts < 0;
            return (
              <div
                key={name}
                className="grid items-center gap-3 py-3 border-b border-[#1A3225] last:border-b-0"
                style={{ gridTemplateColumns: '36px 150px 1fr 90px' }}
              >
                <span className={`font-mono text-sm ${isFirst ? 'text-[#A8E063]' : 'text-[#5C7466]'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-2.5 min-w-0">
                  <MemberAvatar member={photoMap[name]} size={32} />
                  <span className={`text-sm font-semibold truncate ${isFirst ? 'text-[#A8E063]' : 'text-[#F3F6F1]'}`}>
                    {name}
                  </span>
                </div>
                <div className="h-2.5 bg-[#1A3225] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                    className="h-full rounded-sm"
                    style={{
                      background: isNeg
                        ? 'linear-gradient(90deg, #7a3a2e, #F2705C)'
                        : 'linear-gradient(90deg, #4d7a2e, #A8E063)',
                    }}
                  />
                </div>
                <span className={`font-mono text-sm font-semibold text-right ${isNeg ? 'text-[#F2705C]' : 'text-[#F3F6F1]'}`}>
                  {fmtPts(pts)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
