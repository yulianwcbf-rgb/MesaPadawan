import { db } from '@/api/base44Client';

import React, { useState, useEffect } from 'react';

import { fmtPts, fmtBRL, fmtDateBR } from '@/lib/scoring';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

export default function HistoricoTab({ refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const e = await db.entities.WeeklyEntry.list('-week_start');
    setEntries(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este lançamento?')) return;
    await db.entities.WeeklyEntry.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Lançamento removido.' });
  };

  const handleExport = () => {
    const header = ['Semana', 'Assessor', 'Captacao', 'Consorcio', 'ReuniaoAgendada', 'ReuniaoRealizada', 'R1', 'R2', 'ReuniaoIP', 'ReuniaoAP', 'PA', 'Recomendacoes', 'NovasContas', 'ContasTotais', 'PatrimonioLiquido', 'PontosTotais'];
    const lines = [header.join(';')];
    entries.forEach(e => {
      lines.push([
        fmtDateBR(e.week_start), e.assessor, e.captacao, e.consorcio, e.reuniao_agendada, e.reuniao_realizada, e.r1, e.r2, e.reuniao_ip, e.reuniao_ap, e.pa, e.recomendacoes, e.contas, e.contas_totais, e.patrimonio_liquido, e.total_points
      ].join(';'));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mesa_padawan_historico.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        Nenhum lançamento registrado ainda. Use a aba <span className="text-[#F3F6F1] font-semibold">Lançamento</span> para adicionar.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] flex items-baseline gap-2.5">
          Histórico de lançamentos
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">
            {entries.length} registro(s)
          </span>
        </h2>
        <button
          onClick={handleExport}
          className="font-mono text-xs font-semibold tracking-wide text-[#8FA897] border border-[#224030] px-3 py-2 rounded-md hover:text-[#F3F6F1] hover:border-[#8FA897] transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto -mx-5 md:-mx-6">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr>
              {['Semana', 'Assessor', 'Captação', 'R1', 'Recom.', 'Pontos', ''].map(h => (
                <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] px-3 py-2 border-b border-[#224030]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-[#163524] transition-colors">
                <td className="px-3 py-2.5 border-b border-[#1A3225]">{fmtDateBR(e.week_start)}</td>
                <td className="px-3 py-2.5 border-b border-[#1A3225]">{e.assessor}</td>
                <td className="px-3 py-2.5 border-b border-[#1A3225] font-mono text-right">{fmtBRL(e.captacao)}</td>
                <td className="px-3 py-2.5 border-b border-[#1A3225] font-mono text-right">{e.r1}</td>
                <td className="px-3 py-2.5 border-b border-[#1A3225] font-mono text-right">{e.recomendacoes}</td>
                <td className={`px-3 py-2.5 border-b border-[#1A3225] font-mono text-right font-semibold ${e.total_points < 0 ? 'text-[#F2705C]' : 'text-[#A8E063]'}`}>
                  {fmtPts(e.total_points)}
                </td>
                <td className="px-3 py-2.5 border-b border-[#1A3225]">
                  <button onClick={() => handleDelete(e.id)} className="text-[#5C7466] hover:text-[#F2705C] transition-colors">
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
