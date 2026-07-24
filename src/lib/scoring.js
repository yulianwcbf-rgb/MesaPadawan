export const RULES = {
  captacaoPor200k: 10,
  captacaoPor50kExtra: 5,
  pontoPorR1: 1,
  reunioesBonusThreshold: 15,
  reunioesBonusMultiplier: 1.8,
  pontoPorReuniaoIP: 3,
  pontoPorR2: 2,
  pontoPor100kConsorcio: 2,
  pontoPor10kPA: 2,
  pontoPorRecomendacao: 5,
  recomendacaoBonusThreshold: 20,
  recomendacaoBonusMultiplier: 1.6,
  penalidadeRecomendacoesBaixas: -10,
  penalidadeReunioesBaixas: -10,
  reunioesMinimas: 5,
  recomendacoesMinimas: 5,
  bonusReceitaEscritorio: 5,
  penalidadeReceitaEscritorio: -5
};

export function calcPoints(input) {
  const b = [];
  let total = 0;
  const add = (label, pts) => {
    if (pts !== 0) { b.push({ label, pts }); total += pts; }
  };

  const captacao = input.captacao || 0;
  if (captacao >= 200000) {
    const blocosExtra = Math.floor((captacao - 200000) / 50000);
    add(
      `Captação — R$ 200k${blocosExtra > 0 ? ` + ${blocosExtra}× R$ 50k extra` : ''}`,
      RULES.captacaoPor200k + blocosExtra * RULES.captacaoPor50kExtra
    );
  }

  const r1Base = (input.r1 || 0) * RULES.pontoPorR1;
  const r2Base = (input.r2 || 0) * RULES.pontoPorR2;
  const ipBase = (input.reuniao_ip || 0) * RULES.pontoPorReuniaoIP;
  const apBase = (input.reuniao_ap || 0) * RULES.pontoPorReuniaoIP;

  add(`R1 — ${input.r1 || 0} reunião(ões)`, r1Base);
  add(`R2 — ${input.r2 || 0} reunião(ões)`, r2Base);
  add(`Reuniões IP — ${input.reuniao_ip || 0}`, ipBase);
  add(`Reuniões AP — ${input.reuniao_ap || 0}`, apBase);

  const totalReunioes = (input.r1 || 0) + (input.r2 || 0) + (input.reuniao_ip || 0) + (input.reuniao_ap || 0);
  if (totalReunioes >= RULES.reunioesBonusThreshold) {
    const combinedBase = r1Base + r2Base + ipBase + apBase;
    add(
      `Bônus — ${totalReunioes} reuniões totais (×${RULES.reunioesBonusMultiplier})`,
      combinedBase * (RULES.reunioesBonusMultiplier - 1)
    );
  }

  const blocosConsorcio = Math.floor((input.consorcio || 0) / 100000);
  add(`Consórcio — ${blocosConsorcio}× R$ 100k`, blocosConsorcio * RULES.pontoPor100kConsorcio);

  const blocosPA = Math.floor((input.pa || 0) / 10000);
  add(`PA — ${blocosPA}× R$ 10k`, blocosPA * RULES.pontoPor10kPA);

  if ((input.receita_escritorio || 0) > 0) {
    add(`Receita Escritório — preenchido`, RULES.bonusReceitaEscritorio);
  } else {
    add(`Receita Escritório — não preenchido`, RULES.penalidadeReceitaEscritorio);
  }

  let recPts = (input.recomendacoes || 0) * RULES.pontoPorRecomendacao;
  let recLabel = `Recomendações — ${input.recomendacoes || 0}`;
  if ((input.recomendacoes || 0) > RULES.recomendacaoBonusThreshold) {
    recPts = recPts * RULES.recomendacaoBonusMultiplier;
    recLabel += ` (bônus ×${RULES.recomendacaoBonusMultiplier})`;
  }
  add(recLabel, recPts);

  if ((input.recomendacoes || 0) <= RULES.recomendacoesMinimas) {
    add(`Penalidade — recomendações ≤ ${RULES.recomendacoesMinimas}`, RULES.penalidadeRecomendacoesBaixas);
  }
  if (totalReunioes <= RULES.reunioesMinimas) {
    add(`Penalidade — reuniões ≤ ${RULES.reunioesMinimas}`, RULES.penalidadeReunioesBaixas);
  }

  return { total: Math.round(total * 10) / 10, breakdown: b };
}

export function fmtPts(n) {
  const v = Math.round(n * 10) / 10;
  return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR');
}

export function fmtBRL(n) {
  return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function todayMondayISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function fmtDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtMonthBR(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${m}/${y}`;
}