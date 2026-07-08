import { db } from '@/api/base44Client';

import React, { useState, useEffect, useMemo } from 'react';

import { calcPoints, fmtPts, fmtDateBR } from '@/lib/scoring';
import { useToast } from '@/components/ui/use-toast';

const LEADER_FIELDS = [
  { key: 'captacao', label: 'Captação total (R$)', hint: '+10 pts a cada R$ 200k', step: '1000' },
  { key: 'contas_totais', label: 'Contas totais (quantidade)', hint: 'Número total de contas', step: '1' },
  { key: 'patrimonio_liquido', label: 'Patrimônio Líquido Total (R$)', hint: 'Patrimônio líquido do assessor', step: '1000' },
];

export default function LeaderForm({ onSaved }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [leaderFields, setLeaderFields] = useState({ captacao: 0, contas_totais: 0, patrimonio_liquido: 0 });
  const { toast } = useToast();

  useEffect(() => {
    db.entities.WeeklyEntry.list('-week_start', 200).then(e => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  const selectedEntry = entries.find(e => e.id === selectedId);

  useEffect(() => {
    if (selectedEntry) {
      setLeaderFields({
        captacao: selectedEntry.captacao || 0,
        contas_totais: selectedEntry.contas_totais || 0,
        patrimonio_liquido: selectedEntry.patrimonio_liquido || 0,
      });
    }
  }, [selectedId]);

  const { total, breakdown } = useMemo(() => {
    if (!selectedEntry) return { total: 0, breakdown: [] };
    return calcPoints({ ...selectedEntry, ...leaderFields });
  }, [selectedEntry, leaderFields]);

  const setNum = (field, val) => setLeaderFields(f => ({ ...f, [field]: parseFloat(val) || 0 }));

  const handleSave = async () => {
    if (!selectedEntry) { toast({ title: 'Selecione um lançamento.', variant: 'destructive' }); return; }
    setSaving(true);
    const merged = { ...selectedEntry, ...leaderFields };
    const { total: t, breakdown: bd } = calcPoints(merged);
    await db.entities.WeeklyEntry.update(selectedEntry.id, {
      captacao: leaderFields.captacao,
      contas_totais: leaderFields.contas_totais,
      patrimonio_liquido: leaderFields.patrimonio_liquido,
      total_points: t,
      breakdown: bd,
    });
    setSaving(false);
    toast({ title: `Lançamento atualizado: ${selectedEntry.assessor} — ${fmtPts(t)} pts` });
    const e = await db.entities.WeeklyEntry.list('-week_start', 200);
    setEntries(e);
    onSaved?.();
  };

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
        Nenhum lançamento encontrado. Aguarde os assessores registrarem suas semanas.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-4 flex items-baseline gap-2.5">
        Lançamento do líder
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">captação · contas totais · patrimônio</span>
      </h2>

      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-[11.5px] text-[#8FA897] font-mono tracking-wide">Lançamento</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="field-input">
          <option value="">Selecione um lançamento…</option>
          {entries.map(e => (
            <option key={e.id} value={e.id}>{e.assessor} — {fmtDateBR(e.week_start)}</option>
          ))}
        </select>
      </div>

      {selectedEntry ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-3.5">
            {LEADER_FIELDS.map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[11.5px] text-[#8FA897] font-mono tracking-wide">{f.label}</label>
                <input
                  type="number"
                  value={leaderFields[f.key] || ''}
                  onChange={e => setNum(f.key, e.target.value)}
                  placeholder="0"
                  className="field-input"
                  min="0"
                  step={f.step}
                />
                <span className="text-[10.5px] text-[#5C7466]">{f.hint}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-lg bg-[rgba(168,224,99,0.08)] border border-[rgba(168,224,99,0.2)] flex items-center justify-between">
            <span className="text-xs text-[#8FA897]">Pontuação total atualizada</span>
            <span className={`font-mono text-xl font-bold ${total < 0 ? 'text-[#F2705C]' : 'text-[#A8E063]'}`}>
              {fmtPts(total)}
            </span>
          </div>
          {breakdown.length > 0 && (
            <div className="mt-3 flex flex-col gap-0.5 font-mono text-[11.5px] text-[#8FA897]">
              {breakdown.map((b, i) => (
                <div key={i} className="flex justify-between">
                  <span>{b.label}</span>
                  <span className={b.pts >= 0 ? 'text-[#A8E063]' : 'text-[#F2705C]'}>{fmtPts(b.pts)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-mono text-sm font-semibold tracking-wide bg-[#A8E063] text-[#0A1F16] px-5 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Atualizar lançamento'}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-sm text-[#5C7466] py-8">
          Selecione um lançamento acima para preencher os valores do líder.
        </div>
      )}
    </div>
  );
}
