import { db } from '@/api/base44Client';

import React, { useState, useEffect, useMemo } from 'react';

import { calcPoints, fmtPts, todayMondayISO } from '@/lib/scoring';
import { useToast } from '@/components/ui/use-toast';
import LancamentoImport from '@/components/padawan/LancamentoImport';
import LeaderForm from '@/components/padawan/LeaderForm';
import PasswordGate from '@/components/PasswordGate';

export default function LancamentoTab({ onSaved }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('manual');
  const { toast } = useToast();

  const [form, setForm] = useState({
    assessor: '',
    week_start: todayMondayISO(),
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
  });

  useEffect(() => {
    db.entities.TeamMember.list().then(t => {
      setTeam(t);
      if (t.length > 0 && !form.assessor) setForm(f => ({ ...f, assessor: t[0].name }));
      setLoading(false);
    });
  }, []);

  const { total, breakdown } = useMemo(() => calcPoints(form), [form]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setNum = (field, val) => set(field, parseFloat(val) || 0);
  const toggle = (field) => set(field, !form[field]);

  const handleSave = async () => {
    if (!form.week_start) {
      toast({ title: 'Selecione a semana.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { total: t, breakdown: bd } = calcPoints(form);
    await db.entities.WeeklyEntry.create({
      ...form,
      total_points: t,
      breakdown: bd,
    });
    setSaving(false);
    toast({ title: `Lançamento salvo: ${form.assessor} — ${fmtPts(t)} pts` });
    onSaved?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#224030] border-t-[#A8E063] rounded-full animate-spin" />
      </div>
    );
  }

  if (team.length === 0) {
    return (
      <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-10 text-center text-sm text-[#8FA897]">
        Cadastre assessores na aba <span className="text-[#F3F6F1] font-semibold">Equipe</span> antes de lançar pontos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <button
          onClick={() => setMode('manual')}
          className={`font-mono text-xs tracking-wide px-4 py-2 rounded-md border transition-colors ${mode === 'manual' ? 'bg-[#A8E063] text-[#0A1F16] border-[#A8E063]' : 'text-[#8FA897] border-[#224030] hover:text-[#F3F6F1]'}`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('import')}
          className={`font-mono text-xs tracking-wide px-4 py-2 rounded-md border transition-colors ${mode === 'import' ? 'bg-[#A8E063] text-[#0A1F16] border-[#A8E063]' : 'text-[#8FA897] border-[#224030] hover:text-[#F3F6F1]'}`}
        >
          Importar planilha
        </button>
        <button
          onClick={() => setMode('lider')}
          className={`font-mono text-xs tracking-wide px-4 py-2 rounded-md border transition-colors ${mode === 'lider' ? 'bg-[#A8E063] text-[#0A1F16] border-[#A8E063]' : 'text-[#8FA897] border-[#224030] hover:text-[#F3F6F1]'}`}
        >
          Líder
        </button>
      </div>
      {mode === 'import' ? (
        <LancamentoImport onSaved={onSaved} />
      ) : mode === 'lider' ? (
        <PasswordGate title="Líder — acesso restrito"><LeaderForm onSaved={onSaved} /></PasswordGate>
      ) : (
        <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
          <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-1 flex items-baseline gap-2.5">
            Lançamento semanal
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">manual</span>
      </h2>
      <p className="text-[11px] text-[#5C7466] mb-4">Captação, contas totais e patrimônio líquido são preenchidos pelo líder na aba "Líder".</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3.5">
        {/* Assessor + Semana */}
        <Field label="Assessor">
          <select value={form.assessor} onChange={e => set('assessor', e.target.value)} className="field-input">
            {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Semana (início)">
          <input type="date" value={form.week_start} onChange={e => set('week_start', e.target.value)} className="field-input" />
        </Field>

        <Divider label="Atividade & Reuniões" />
        <Field label="Reunião Agendada (quantidade)" hint="Reuniões agendadas na semana">
          <input type="number" value={form.reuniao_agendada || ''} onChange={e => setNum('reuniao_agendada', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="Reunião Realizada (quantidade)" hint="Reuniões realizadas na semana">
          <input type="number" value={form.reuniao_realizada || ''} onChange={e => setNum('reuniao_realizada', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="R1 (quantidade)" hint="+1 pt cada · acima de 15 ×1,8">
          <input type="number" value={form.r1 || ''} onChange={e => setNum('r1', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="R2 (quantidade)" hint="+2 pts cada · meta: 5/semana">
          <input type="number" value={form.r2 || ''} onChange={e => setNum('r2', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="Reuniões IP (quantidade)" hint="+3 pts cada">
          <input type="number" value={form.reuniao_ip || ''} onChange={e => setNum('reuniao_ip', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="Reuniões AP (quantidade)" hint="+3 pts cada">
          <input type="number" value={form.reuniao_ap || ''} onChange={e => setNum('reuniao_ap', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="PA — Inteligência/Alavancagem (R$)" hint="+2 pts a cada R$ 10k">
          <input type="number" value={form.pa || ''} onChange={e => setNum('pa', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>
        <Field label="Receita Escritorio (R$)" hint="+5 pts preenchido · -5 pts vazio">
          <input type="number" value={form.receita_escritorio || ''} onChange={e => setNum('receita_escritorio', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>
        <Field label="Recomendações (quantidade)" hint="+5 pts cada · >20 ×1,6 · ≤5 → -10">
          <input type="number" value={form.recomendacoes || ''} onChange={e => setNum('recomendacoes', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="Novas contas abertas (quantidade)" hint="Meta semanal: 3">
          <input type="number" value={form.contas || ''} onChange={e => setNum('contas', e.target.value)} placeholder="0" className="field-input" min="0" />
        </Field>
        <Field label="Consórcio (R$)" hint="+2 pts a cada R$ 100k">
          <input type="number" value={form.consorcio || ''} onChange={e => setNum('consorcio', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>

        <Divider label="PIPE / Projeções" />
        <Field label="PIPE da próxima semana (R$)" hint="Projeção de captação para a próxima semana">
          <input type="number" value={form.pipe_proxima_semana || ''} onChange={e => setNum('pipe_proxima_semana', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>
        <Field label="PIPE IP (R$)" hint="Projeção de IP">
          <input type="number" value={form.pipe_ip || ''} onChange={e => setNum('pipe_ip', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>
        <Field label="PIPE AP (R$)" hint="Projeção de AP">
          <input type="number" value={form.pipe_ap || ''} onChange={e => setNum('pipe_ap', e.target.value)} placeholder="0" className="field-input" min="0" step="1000" />
        </Field>

      </div>

      {/* Preview */}
      <div className="mt-5 p-4 rounded-lg bg-[rgba(168,224,99,0.08)] border border-[rgba(168,224,99,0.2)] flex items-center justify-between">
        <span className="text-xs text-[#8FA897]">Pontuação total da semana</span>
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
          {saving ? 'Salvando…' : 'Salvar lançamento'}
        </button>
      </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] text-[#8FA897] font-mono tracking-wide">{label}</label>
      {children}
      {hint && <span className="text-[10.5px] text-[#5C7466]">{hint}</span>}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="col-span-1 md:col-span-2 font-mono text-[10.5px] uppercase tracking-widest text-[#A8E063] mt-4 mb-0.5 pt-4 border-t border-[#224030] first:border-t-0 first:pt-0 first:mt-0">
      {label}
    </div>
  );
}

function CheckRow({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-2 bg-[#163524] border border-[#224030] rounded-md px-2.5 py-2.5 cursor-pointer" onClick={onChange}>
      <input type="checkbox" checked={checked} onChange={() => {}} className="w-4 h-4 accent-[#A8E063]" />
      <span className="text-xs text-[#F3F6F1]">{label}</span>
    </div>
  );
}
