import { db } from '@/api/base44Client';

import React, { useState, useEffect, useMemo } from 'react';

import { fmtBRL, fmtDateBR, fmtMonthBR, fmtPts } from '@/lib/scoring';
import MemberAvatar from '@/components/padawan/MemberAvatar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tooltipStyle = { background: '#163524', border: '1px solid #224030', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' };

const VIEW_TABS = [
  { key: 'total', label: 'Total', subtitle: 'Desempenho acumulado de todas as semanas' },
  { key: 'last5', label: 'Últimos 5', subtitle: 'Últimas 5 semanas lançadas' },
  { key: 'monthly', label: 'Mensal', subtitle: 'Desempenho acumulado por mês' },
  { key: 'lastMonth', label: 'Último Mês', subtitle: 'Performance do último mês' },
  { key: 'consolidado', label: 'Dados Consolidados', subtitle: 'Comparação de todas as métricas entre todos os assessores' },
];

function computeTotals(list) {
  if (!list.length) return { captacao: 0, reunioes: 0, recomendacoes: 0, contas_totais: 0, patrimonio: 0, pontos: 0 };
  return {
    captacao: list.reduce((s, e) => s + (e.captacao || 0), 0),
    reunioes: list.reduce((s, e) => s + (e.r1 || 0) + (e.r2 || 0) + (e.reuniao_ip || 0) + (e.reuniao_ap || 0), 0),
    recomendacoes: list.reduce((s, e) => s + (e.recomendacoes || 0), 0),
    contas_totais: Math.max(...list.map(e => e.contas_totais || 0)),
    patrimonio: Math.max(...list.map(e => e.patrimonio_liquido || 0)),
    pontos: list.reduce((s, e) => s + (e.total_points || 0), 0),
  };
}

function entryToWeekly(e) {
  const r1 = e.r1 || 0, r2 = e.r2 || 0, ip = e.reuniao_ip || 0, ap = e.reuniao_ap || 0;
  return {
    week: fmtDateBR(e.week_start),
    captacao: e.captacao || 0,
    consorcio: e.consorcio || 0,
    patrimonio: e.patrimonio_liquido || 0,
    pa: e.pa || 0,
    r1, r2, ip_ap: ip + ap,
    total_reunioes: r1 + r2 + ip + ap,
    receita_escritorio: e.receita_escritorio || 0,
    recomendacoes: e.recomendacoes || 0,
    contas: e.contas || 0,
    contas_totais: e.contas_totais || 0,
    pipe_proxima_semana: e.pipe_proxima_semana || 0,
    pipe_ip: e.pipe_ip || 0,
    pipe_ap: e.pipe_ap || 0,
  };
}

export default function AnaliseTab({ refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [viewMode, setViewMode] = useState('total');

  useEffect(() => {
    async function load() {
      const [e, t] = await Promise.all([
        db.entities.WeeklyEntry.list('week_start'),
        db.entities.TeamMember.list(),
      ]);
      setEntries(e);
      setTeam(t);
      if (t.length > 0) setSelected(s => s || t[0].name);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const selectedMember = team.find(m => m.name === selected);

  const { weekly, totals, mine, monthlyData, monthlyTotals, lastMonthData, lastMonthTotals, weeklyLast5, totalsLast5 } = useMemo(() => {
    const mine = (() => {
      const sorted = entries
        .filter(e => e.assessor === selected)
        .sort((a, b) => a.week_start.localeCompare(b.week_start));
      if (sorted.length <= 1) return sorted;
      // Push summary/baseline rows (large gap before next entry) to the end
      const outliers = [];
      const main = [];
      for (let i = 0; i < sorted.length; i++) {
        if (i < sorted.length - 1) {
          const diff = (new Date(sorted[i + 1].week_start) - new Date(sorted[i].week_start)) / 86400000;
          if (diff > 90) { outliers.push(sorted[i]); continue; }
        }
        main.push(sorted[i]);
      }
      return [...main, ...outliers];
    })();
    const weekly = mine.map(entryToWeekly);
    const totals = computeTotals(mine);
    const weeklyLast5 = weekly.slice(-5);
    const totalsLast5 = computeTotals(mine.slice(-5));

    // Monthly aggregation
    const monthlyMap = {};
    mine.forEach(e => {
      const ym = e.week_start.slice(0, 7);
      if (!monthlyMap[ym]) monthlyMap[ym] = { ym, captacao: 0, consorcio: 0, pa: 0, r1: 0, r2: 0, ip_ap: 0, receita_escritorio: 0, recomendacoes: 0, contas: 0, contas_totais: 0, patrimonio: 0, pipe_proxima_semana: 0, pipe_ip: 0, pipe_ap: 0, pontos: 0, _entries: [] };
      const m = monthlyMap[ym];
      m.captacao += e.captacao || 0;
      m.consorcio += e.consorcio || 0;
      m.pa += e.pa || 0;
      m.r1 += e.r1 || 0;
      m.r2 += e.r2 || 0;
      m.ip_ap += (e.reuniao_ip || 0) + (e.reuniao_ap || 0);
      m.receita_escritorio += e.receita_escritorio || 0;
      m.recomendacoes += e.recomendacoes || 0;
      m.contas += e.contas || 0;
      m.contas_totais = e.contas_totais || m.contas_totais;
      m.patrimonio = e.patrimonio_liquido || m.patrimonio;
      m.pipe_proxima_semana += e.pipe_proxima_semana || 0;
      m.pipe_ip += e.pipe_ip || 0;
      m.pipe_ap += e.pipe_ap || 0;
      m.pontos += e.total_points || 0;
      m._entries.push(e);
    });
    const monthlySorted = Object.values(monthlyMap).sort((a, b) => a.ym.localeCompare(b.ym));
    const monthlyData = monthlySorted.map(m => ({
      month: fmtMonthBR(m.ym),
      captacao: m.captacao,
      consorcio: m.consorcio,
      patrimonio: m.patrimonio,
      pa: m.pa,
      r1: m.r1,
      r2: m.r2,
      ip_ap: m.ip_ap,
      total_reunioes: m.r1 + m.r2 + m.ip_ap,
      receita_escritorio: m.receita_escritorio,
      recomendacoes: m.recomendacoes,
      contas: m.contas,
      contas_totais: m.contas_totais,
      pipe_proxima_semana: m.pipe_proxima_semana,
      pipe_ip: m.pipe_ip,
      pipe_ap: m.pipe_ap,
    }));
    const monthlyTotals = monthlySorted.length ? {
      captacao: monthlySorted.reduce((s, m) => s + m.captacao, 0),
      reunioes: monthlySorted.reduce((s, m) => s + m.r1 + m.r2 + m.ip_ap, 0),
      recomendacoes: monthlySorted.reduce((s, m) => s + m.recomendacoes, 0),
      contas_totais: Math.max(...monthlySorted.map(m => m.contas_totais || 0)),
      patrimonio: Math.max(...monthlySorted.map(m => m.patrimonio || 0)),
      pontos: monthlySorted.reduce((s, m) => s + m.pontos, 0),
    } : { captacao: 0, reunioes: 0, recomendacoes: 0, contas_totais: 0, patrimonio: 0, pontos: 0 };

    // Last month
    const lastMonth = monthlySorted[monthlySorted.length - 1];
    const lastMonthData = lastMonth ? lastMonth._entries.map(entryToWeekly) : [];
    const lastMonthTotals = lastMonth ? {
      captacao: lastMonth.captacao,
      reunioes: lastMonth.r1 + lastMonth.r2 + lastMonth.ip_ap,
      recomendacoes: lastMonth.recomendacoes,
      contas_totais: Math.max(...lastMonth._entries.map(e => e.contas_totais || 0)),
      patrimonio: Math.max(...lastMonth._entries.map(e => e.patrimonio_liquido || 0)),
      pontos: lastMonth.pontos,
    } : { captacao: 0, reunioes: 0, recomendacoes: 0, contas_totais: 0, patrimonio: 0, pontos: 0 };

    return { weekly, totals, mine, monthlyData, monthlyTotals, lastMonthData, lastMonthTotals, weeklyLast5, totalsLast5 };
  }, [entries, selected]);

  // Default selected week to the latest
  useEffect(() => {
    if (mine.length > 0) {
      setSelectedWeek(s => s && mine.some(e => e.week_start === s) ? s : mine[mine.length - 1].week_start);
    }
  }, [mine]);

  const weekEntry = useMemo(
    () => mine.find(e => e.week_start === selectedWeek) || null,
    [mine, selectedWeek]
  );

  const metricCompare = useMemo(() => {
    if (!weekEntry) return [];
    const others = entries.filter(e => e.assessor !== selected);
    const avg = (field) => others.length ? others.reduce((s, e) => s + (e[field] || 0), 0) / others.length : 0;
    const norm = (val, scale) => Math.round((val / scale) * 100) / 100;
    return [
      { label: 'R1', sem: weekEntry.r1 || 0, media: avg('r1') },
      { label: 'R2', sem: weekEntry.r2 || 0, media: avg('r2') },
      { label: 'IP', sem: weekEntry.reuniao_ip || 0, media: avg('reuniao_ip') },
      { label: 'AP', sem: weekEntry.reuniao_ap || 0, media: avg('reuniao_ap') },
      { label: 'Recom.', sem: weekEntry.recomendacoes || 0, media: avg('recomendacoes') },
      { label: 'Contas', sem: weekEntry.contas || 0, media: avg('contas') },
      { label: 'Capt.(200k)', sem: norm(weekEntry.captacao || 0, 200000), media: norm(avg('captacao'), 200000) },
      { label: 'Cons.(100k)', sem: norm(weekEntry.consorcio || 0, 100000), media: norm(avg('consorcio'), 100000) },
      { label: 'PA(10k)', sem: norm(weekEntry.pa || 0, 10000), media: norm(avg('pa'), 10000) },
    ];
  }, [weekEntry, entries, selected]);

  const { activeData, activeTotals, activeXKey } = useMemo(() => {
    switch (viewMode) {
      case 'last5': return { activeData: weeklyLast5, activeTotals: totalsLast5, activeXKey: 'week' };
      case 'monthly': return { activeData: monthlyData, activeTotals: monthlyTotals, activeXKey: 'month' };
      case 'lastMonth': return { activeData: lastMonthData, activeTotals: lastMonthTotals, activeXKey: 'week' };
      default: return { activeData: weekly, activeTotals: totals, activeXKey: 'week' };
    }
  }, [viewMode, weekly, totals, weeklyLast5, totalsLast5, monthlyData, monthlyTotals, lastMonthData, lastMonthTotals]);

  const activeSubtitle = VIEW_TABS.find(v => v.key === viewMode)?.subtitle || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#224030] border-t-[#A8E063] rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-10 text-center text-sm text-[#8FA897]">
        Sem dados para análise ainda. Use a aba <span className="text-[#F3F6F1] font-semibold">Lançamento</span> para registrar semanas.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Member selector + photo */}
      <div className="flex items-center gap-5 flex-wrap">
        <MemberAvatar member={selectedMember} size={112} />
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-bold text-[#F3F6F1]">{selected}</h2>
          <p className="font-mono text-sm text-[#A8E063]">
            Patrimônio líquido: <span className="font-semibold">{fmtBRL(totals.patrimonio)}</span>
          </p>
          <div className="flex gap-2 flex-wrap mt-1">
            {team.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m.name)}
                className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selected === m.name
                    ? 'bg-[#A8E063] border-[#A8E063] text-[#0B1F14] font-semibold'
                    : 'border-[#224030] text-[#8FA897] hover:text-[#F3F6F1] hover:border-[#3A5C46]'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== SECTION 1: TOTAL ANALYSIS ===================== */}
      <section>
        <SectionHeader title="Análise Total" subtitle={activeSubtitle} />

        {/* View tabs */}
        <div className="flex gap-1 mb-5 border-b border-[#224030] overflow-x-auto">
          {VIEW_TABS.map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`font-mono text-xs tracking-wide px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                viewMode === v.key
                  ? 'text-[#A8E063] border-[#A8E063]'
                  : 'text-[#8FA897] border-transparent hover:text-[#F3F6F1]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {viewMode === 'consolidado' ? (
          <ConsolidatedTable team={team} entries={entries} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <SummaryCard label="Captação total" value={fmtBRL(activeTotals.captacao)} />
              <SummaryCard label="Reuniões total" value={String(activeTotals.reunioes)} />
              <SummaryCard label="Recomendações total" value={String(activeTotals.recomendacoes)} />
              <SummaryCard label="Contas totais" value={String(activeTotals.contas_totais)} />
              <SummaryCard label="Patrimônio líquido" value={fmtBRL(activeTotals.patrimonio)} />
              <SummaryCard label="Pontos acumulados" value={fmtPts(activeTotals.pontos)} accent />
            </div>

            {activeData.length > 0 ? (
              <ChartsGroup data={activeData} xKey={activeXKey} selected={selected} />
            ) : (
              <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-8 text-center text-sm text-[#8FA897]">
                Sem dados para esta visualização.
              </div>
            )}
          </>
        )}
      </section>

      {/* ===================== SECTION 2: WEEK PERFORMANCE ===================== */}
      <section>
        <SectionHeader title="Performance da Semana" subtitle="Detalhamento de uma semana específica" />

        {mine.length === 0 ? (
          <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-8 text-center text-sm text-[#8FA897]">
            Sem semanas registradas para este assessor.
          </div>
        ) : (
          <>
            {/* Week selector */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <span className="font-mono text-xs text-[#8FA897]">Semana:</span>
              <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="field-input max-w-[200px]">
                {[...mine].reverse().map(e => (
                  <option key={e.id} value={e.week_start}>{fmtDateBR(e.week_start)}</option>
                ))}
              </select>
            </div>

            {weekEntry && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <SummaryCard label="Captação" value={fmtBRL(weekEntry.captacao || 0)} />
                  <SummaryCard label="Consórcio" value={fmtBRL(weekEntry.consorcio || 0)} />
                  <SummaryCard label="PA" value={fmtBRL(weekEntry.pa || 0)} />
                  <SummaryCard label="Patrimônio líquido" value={fmtBRL(weekEntry.patrimonio_liquido || 0)} />
                  <SummaryCard label="R1" value={String(weekEntry.r1 || 0)} />
                  <SummaryCard label="R2" value={String(weekEntry.r2 || 0)} />
                  <SummaryCard label="Reuniões IP" value={String(weekEntry.reuniao_ip || 0)} />
                  <SummaryCard label="Reuniões AP" value={String(weekEntry.reuniao_ap || 0)} />
                  <SummaryCard label="Reuniões totais" value={String((weekEntry.r1 || 0) + (weekEntry.r2 || 0) + (weekEntry.reuniao_ip || 0) + (weekEntry.reuniao_ap || 0))} />
                  <SummaryCard label="Recomendações" value={String(weekEntry.recomendacoes || 0)} />
                  <SummaryCard label="Novas contas" value={String(weekEntry.contas || 0)} />
                  <SummaryCard label="Contas totais" value={String(weekEntry.contas_totais || 0)} />
                  <SummaryCard label="PIPE próx. semana" value={fmtBRL(weekEntry.pipe_proxima_semana || 0)} />
                  <SummaryCard label="PIPE IP" value={fmtBRL(weekEntry.pipe_ip || 0)} />
                  <SummaryCard label="PIPE AP" value={fmtBRL(weekEntry.pipe_ap || 0)} />
                  <SummaryCard label="Pontos da semana" value={fmtPts(weekEntry.total_points || 0)} accent />
                </div>

                {metricCompare.length > 0 && (
                  <ChartCard
                    title={`Métricas da semana — ${fmtDateBR(weekEntry.week_start)}`}
                    subtitle="Semana atual vs. média dos demais assessores"
                  >
                    <ResponsiveContainer>
                      <BarChart data={metricCompare} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
                        <XAxis dataKey="label" tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
                        <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" allowDecimals={false} width={40} />
                        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} cursor={{ fill: 'rgba(168,224,99,0.06)' }} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                        <Bar dataKey="sem" name="Esta semana" fill="#A8E063" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="media" name="Média" fill="#6C9EFF" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ConsolidatedTable({ team, entries }) {
  const rows = team.map(m => {
    const totals = computeTotals(entries.filter(e => e.assessor === m.name));
    return { name: m.name, tempoMesa: m.tempo_mesa_meses || 0, ...totals };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-[#224030] bg-[#102A1E]">
      <table className="w-full text-sm font-mono whitespace-nowrap">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-[#8FA897] border-b border-[#224030]">
            <th className="p-3">Assessor</th>
            <th className="p-3">Tempo de mesa</th>
            <th className="p-3">Captação total</th>
            <th className="p-3">Reuniões total</th>
            <th className="p-3">Recomendações total</th>
            <th className="p-3">Contas totais</th>
            <th className="p-3">Patrimônio líquido</th>
            <th className="p-3">Pontos acumulados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} className="border-b border-[#1A3225] last:border-b-0">
              <td className="p-3 font-semibold text-[#F3F6F1]">{r.name}</td>
              <td className="p-3 text-[#8FA897]">{r.tempoMesa ? `${r.tempoMesa} ${r.tempoMesa === 1 ? 'mês' : 'meses'}` : '—'}</td>
              <td className="p-3 text-[#F3F6F1]">{fmtBRL(r.captacao)}</td>
              <td className="p-3 text-[#F3F6F1]">{r.reunioes}</td>
              <td className="p-3 text-[#F3F6F1]">{r.recomendacoes}</td>
              <td className="p-3 text-[#F3F6F1]">{r.contas_totais}</td>
              <td className="p-3 text-[#F3F6F1]">{fmtBRL(r.patrimonio)}</td>
              <td className="p-3 font-semibold text-[#A8E063]">{fmtPts(r.pontos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartsGroup({ data, xKey, selected }) {
  return (
    <>
      <ChartCard title={`Captação × Patrimônio líquido — ${selected}`} subtitle="Evolução">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
            <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
            <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" tickFormatter={(v) => fmtBRL(v).replace('R$ ', '')} width={70} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} formatter={(v) => fmtBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
            <Line type="monotone" dataKey="captacao" name="Captação" stroke="#A8E063" strokeWidth={2} dot={{ r: 3, fill: '#A8E063' }} activeDot={{ r: 5 }} connectNulls />
            <Line type="monotone" dataKey="patrimonio" name="Patrimônio líquido" stroke="#6C9EFF" strokeWidth={2} dot={{ r: 3, fill: '#6C9EFF' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Reuniões — ${selected}`} subtitle="R1, R2 e IP/AP">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
            <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
            <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" allowDecimals={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} cursor={{ fill: 'rgba(168,224,99,0.06)' }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
            <Bar dataKey="r1" name="R1" fill="#A8E063" radius={[3, 3, 0, 0]} />
            <Bar dataKey="r2" name="R2" fill="#6C9EFF" radius={[3, 3, 0, 0]} />
            <Bar dataKey="ip_ap" name="IP/AP" fill="#F2C94C" radius={[3, 3, 0, 0]} />
            <Bar dataKey="total_reunioes" name="Total" fill="#C084FC" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Recomendações — ${selected}`} subtitle="Evolução">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
            <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
            <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" allowDecimals={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} />
            <Line type="monotone" dataKey="recomendacoes" stroke="#F2C94C" strokeWidth={2} dot={{ r: 3, fill: '#F2C94C' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Receita Escritório — ${selected}`} subtitle="Evolução">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
            <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
            <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" tickFormatter={(v) => fmtBRL(v).replace('R$ ', '')} width={70} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} formatter={(v) => fmtBRL(v)} />
            <Line type="monotone" dataKey="receita_escritorio" stroke="#C084FC" strokeWidth={2} dot={{ r: 3, fill: '#C084FC' }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Contas — ${selected}`} subtitle="Contas totais vs. novas contas">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
            <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
            <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" allowDecimals={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} cursor={{ fill: 'rgba(168,224,99,0.06)' }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
            <Bar dataKey="contas_totais" name="Contas totais" fill="#A8E063" radius={[3, 3, 0, 0]} />
            <Bar dataKey="contas" name="Novas contas" fill="#6C9EFF" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <MoneyCompareChart
        data={data} xKey={xKey}
        title={`PIPE × Captação — ${selected}`}
        subtitle="PIPE da próxima semana vs. Captação realizada"
        aKey="pipe_proxima_semana" aName="PIPE próx. semana" aColor="#6C9EFF"
        bKey="captacao" bName="Captação" bColor="#A8E063"
      />

      <MoneyCompareChart
        data={data} xKey={xKey}
        title={`PIPE IP × PA — ${selected}`}
        subtitle="PIPE IP vs. PA"
        aKey="pipe_ip" aName="PIPE IP" aColor="#F2C94C"
        bKey="pa" bName="PA" bColor="#A8E063"
      />

      <MoneyCompareChart
        data={data} xKey={xKey}
        title={`PIPE AP × Consórcio — ${selected}`}
        subtitle="PIPE AP vs. Consórcio"
        aKey="pipe_ap" aName="PIPE AP" aColor="#C084FC"
        bKey="consorcio" bName="Consórcio" bColor="#A8E063"
      />
    </>
  );
}

// Grouped bar chart comparing two monetary (R$) series over the active period.
function MoneyCompareChart({ data, xKey, title, subtitle, aKey, aName, aColor, bKey, bName, bColor }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A3225" />
          <XAxis dataKey={xKey} tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" />
          <YAxis tick={{ fill: '#8FA897', fontSize: 11, fontFamily: 'monospace' }} stroke="#224030" tickFormatter={(v) => fmtBRL(v).replace('R$ ', '')} width={70} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#A8E063' }} cursor={{ fill: 'rgba(168,224,99,0.06)' }} formatter={(v) => fmtBRL(v)} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
          <Bar dataKey={aKey} name={aName} fill={aColor} radius={[3, 3, 0, 0]} />
          <Bar dataKey={bKey} name={bName} fill={bColor} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4 pb-2 border-b border-[#224030]">
      <h2 className="font-heading text-lg font-semibold text-[#F3F6F1]">{title}</h2>
      <p className="text-xs text-[#5C7466] mt-0.5">{subtitle}</p>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-4">
      <p className="text-[11px] text-[#8FA897] font-mono mb-1">{label}</p>
      <p className={`font-mono text-lg font-bold ${accent ? 'text-[#A8E063]' : 'text-[#F3F6F1]'}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6 mb-5">
      <h2 className="font-heading text-base font-semibold text-[#F3F6F1] mb-1">{title}</h2>
      <p className="text-xs text-[#5C7466] mb-4">{subtitle}</p>
      <div style={{ width: '100%', height: 260 }}>{children}</div>
    </div>
  );
}
