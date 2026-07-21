import { db } from '@/api/base44Client';

import React, { useState, useEffect, useMemo } from 'react';

import { fmtPts, fmtBRL, fmtMonthBR, fmtDateBR } from '@/lib/scoring';
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
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('geral');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [goalAssessor, setGoalAssessor] = useState('');

  useEffect(() => {
    async function load() {
      const [e, t] = await Promise.all([
        db.entities.WeeklyEntry.list(),
        db.entities.TeamMember.list(),
      ]);
      setEntries(e);
      const active = t.filter(m => !m.archived);
      setTeam(active);
      if (active.length > 0) setGoalAssessor(a => a || active[0].name);
      setLoading(false);
      // Goals are an optional add-on: don't let a missing/not-yet-migrated
      // monthly_goals table block the rest of the ranking from loading.
      try {
        const g = await db.entities.Goal.list();
        setGoal(g[0] || null);
      } catch {
        setGoal(null);
      }
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

  const activeNames = new Set(team.map(m => m.name));
  const totals = {};
  team.forEach(m => { totals[m.name] = 0; });
  filtered.forEach(e => {
    if (!activeNames.has(e.assessor)) return;
    totals[e.assessor] = (totals[e.assessor] || 0) + (e.total_points || 0);
  });

  const arr = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...arr.map(a => Math.abs(a[1])));

  const noTeam = team.length === 0 && entries.length === 0;

  // Monthly goal progress for the selected assessor: each metric is an
  // accumulation of that assessor's entries in the selected month.
  const goalProgress = (() => {
    if (mode !== 'mensal' || !goalAssessor) return null;
    const mine = entries.filter(e => e.assessor === goalAssessor && (e.week_start || '').slice(0, 7) === selectedMonth);
    const sum = (field) => mine.reduce((s, e) => s + (e[field] || 0), 0);
    return {
      nnm: sum('captacao'),
      ap: sum('consorcio'),
      ip: sum('pa'),
      recomendacoes: sum('recomendacoes'),
      reunioes: mine.reduce((s, e) => s + (e.r1 || 0) + (e.r2 || 0) + (e.reuniao_ip || 0) + (e.reuniao_ap || 0), 0),
    };
  })();

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

      {mode === 'mensal' && !noTeam && months.length > 0 && (
        <div className="rounded-xl border border-[#224030] bg-[#0D2418] p-4 md:p-5 mb-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h3 className="font-heading text-sm font-semibold text-[#F3F6F1]">Metas do mês</h3>
            <select
              value={goalAssessor}
              onChange={e => setGoalAssessor(e.target.value)}
              className="field-input max-w-[200px]"
            >
              {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-3">
            <GoalBar label="NNM" current={goalProgress?.nnm || 0} target={goal?.goal_nnm || 0} formatter={fmtBRL} />
            <GoalBar label="AP" current={goalProgress?.ap || 0} target={goal?.goal_ap || 0} formatter={fmtBRL} />
            <GoalBar label="IP" current={goalProgress?.ip || 0} target={goal?.goal_ip || 0} formatter={fmtBRL} />
            <GoalBar label="Recomendações" current={goalProgress?.recomendacoes || 0} target={goal?.goal_recomendacoes || 0} formatter={String} />
            <GoalBar label="Reuniões totais" current={goalProgress?.reunioes || 0} target={goal?.goal_reunioes || 0} formatter={String} />
          </div>
        </div>
      )}

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

// Horizontal gauge: current progress toward a monthly target.
function GoalBar({ label, current, target, formatter }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 flex-shrink-0 text-xs text-[#8FA897] font-mono">{label}</span>
      <div className="flex-1 h-2 bg-[#1A3225] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full rounded-full bg-[#A8E063]"
        />
      </div>
      <span className="w-36 flex-shrink-0 text-right text-xs font-mono text-[#F3F6F1] whitespace-nowrap">
        {target > 0 ? `${formatter(current)} / ${formatter(target)}` : `${formatter(current)} · sem meta`}
      </span>
    </div>
  );
}
