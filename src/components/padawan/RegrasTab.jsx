import { db } from '@/api/base44Client';

import React, { useState, useEffect } from 'react';

import { fmtBRL } from '@/lib/scoring';
import { useToast } from '@/components/ui/use-toast';
import PasswordGate from '@/components/PasswordGate';

function RuleLine({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#1A3225] text-xs">
      <span className="text-[#F3F6F1]">{label}</span>
      <span className="font-mono text-[#8FA897] whitespace-nowrap pl-3">{value}</span>
    </div>
  );
}

function RuleBlock({ title, children }) {
  return (
    <div>
      <h3 className="font-heading text-sm font-semibold text-[#A8E063] mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

const GOAL_FIELDS = [
  { key: 'goal_nnm', label: 'Captação mensal — NNM (R$)', ruleLabel: 'Captação mensal (NewNetMoney)', formatter: fmtBRL },
  { key: 'goal_ap', label: 'Alavancagem Patrimonial — AP (R$)', ruleLabel: 'Alavancagem Patrimonial (mensal)', formatter: fmtBRL },
  { key: 'goal_ip', label: 'Inteligência Patrimonial — IP (R$)', ruleLabel: 'Inteligência Patrimonial (mensal)', formatter: fmtBRL },
  { key: 'goal_recomendacoes', label: 'Recomendações (mensal)', ruleLabel: 'Recomendações (mensal)', formatter: String },
  { key: 'goal_reunioes', label: 'Reuniões totais (mensal)', ruleLabel: 'Reuniões totais (mensal)', formatter: String },
];

function MetasBlock() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const rows = await db.entities.Goal.list();
    setGoal(rows[0] || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] flex items-baseline gap-2.5">
          Metas de referência
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">EWZ Capital</span>
        </h2>
        <button
          onClick={() => setEditing(e => !e)}
          className="font-mono text-xs font-semibold tracking-wide text-[#8FA897] border border-[#224030] px-3 py-2 rounded-md hover:text-[#F3F6F1] hover:border-[#8FA897] transition-colors"
        >
          {editing ? 'Fechar' : 'Editar metas'}
        </button>
      </div>

      {loading ? (
        <div className="w-5 h-5 border-2 border-[#224030] border-t-[#A8E063] rounded-full animate-spin mx-auto" />
      ) : (
        <>
          <RuleLine label="Reuniões semanais" value="15 total · 10 R1 + 5 R2 + IP/AP" />
          <RuleLine label="Recomendações semanais" value="5" />
          <RuleLine label="Contas abertas por semana" value="3" />
          {GOAL_FIELDS.map(f => (
            <RuleLine
              key={f.key}
              label={f.ruleLabel}
              value={goal?.[f.key] ? f.formatter(goal[f.key]) : '—'}
            />
          ))}
        </>
      )}

      {editing && (
        <div className="mt-4 pt-4 border-t border-[#1A3225]">
          <PasswordGate title="Metas — acesso do líder">
            <GoalsForm goal={goal} onSaved={() => { setEditing(false); load(); }} />
          </PasswordGate>
        </div>
      )}
    </div>
  );
}

function GoalsForm({ goal, onSaved }) {
  const [form, setForm] = useState(() => {
    const f = {};
    GOAL_FIELDS.forEach(({ key }) => { f[key] = goal?.[key] || 0; });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const setNum = (field, val) => setForm(f => ({ ...f, [field]: parseFloat(val) || 0 }));

  const handleSave = async () => {
    setSaving(true);
    if (goal) await db.entities.Goal.update(goal.id, form);
    else await db.entities.Goal.create(form);
    setSaving(false);
    toast({ title: 'Metas mensais atualizadas.' });
    onSaved?.();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {GOAL_FIELDS.map(f => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[#8FA897] font-mono">{f.label}</label>
          <input
            type="number"
            min="0"
            value={form[f.key] || ''}
            onChange={e => setNum(f.key, e.target.value)}
            placeholder="0"
            className="field-input"
          />
        </div>
      ))}
      <div className="md:col-span-2 flex justify-end mt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-mono text-sm font-semibold tracking-wide bg-[#A8E063] text-[#0A1F16] px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar metas'}
        </button>
      </div>
    </div>
  );
}

export default function RegrasTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
        <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-5 flex items-baseline gap-2.5">
          Regras de pontuação
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">referência</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RuleBlock title="Captação">
            <RuleLine label="A cada R$ 200k captados" value="+10 pts" />
            <RuleLine label="Cada R1" value="+1 pt" />
            <RuleLine label="Mais de 15 R1 na semana" value="×1,8" />
            <RuleLine label="Cada R2" value="+2 pts" />
            <RuleLine label="Cada reunião com IP/AP" value="+3 pts" />
            <RuleLine label="A cada R$ 100k de consórcio" value="+2 pts" />
            <RuleLine label="A cada R$ 10k de PA" value="+2 pts" />
            <RuleLine label="Cada recomendação" value="+5 pts" />
            <RuleLine label="Mais de 20 recomendações" value="×1,6" />
            <RuleLine label="Recomendações ≤ 5 na semana" value="-10 pts" />
            <RuleLine label="Reuniões ≤ 5 na semana" value="-10 pts" />
            <RuleLine label="Receita Escritório preenchida" value="+5 pts" />
            <RuleLine label="Receita Escritório não preenchida" value="-5 pts" />
          </RuleBlock>

        </div>
      </div>

      <MetasBlock />
    </div>
  );
}
