import React from 'react';

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

      <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
        <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-4 flex items-baseline gap-2.5">
          Metas de referência
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">EWZ Capital</span>
        </h2>
        <RuleLine label="Captação mensal (NewNetMoney)" value="R$ 800k · R$ 200k/semana" />
        <RuleLine label="Reuniões semanais" value="15 total · 10 R1 + 5 R2 + IP/AP" />
        <RuleLine label="Recomendações semanais" value="5" />
        <RuleLine label="Contas abertas por semana" value="3" />
        <RuleLine label="Alavancagem Patrimonial (mensal)" value="R$ 200k" />
        <RuleLine label="Inteligência Patrimonial (mensal)" value="R$ 10k" />
      </div>
    </div>
  );
}