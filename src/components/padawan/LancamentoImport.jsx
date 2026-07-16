import { db } from '@/api/base44Client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

import { calcPoints } from '@/lib/scoring';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload, Check } from 'lucide-react';

const FIELDS = [
  { key: 'assessor', label: 'Assessor', type: 'text' },
  { key: 'week_start', label: 'Semana (início)', type: 'date' },
  { key: 'captacao', label: 'Captação (R$)', type: 'number' },
  { key: 'consorcio', label: 'Consórcio (R$)', type: 'number' },
  { key: 'reuniao_agendada', label: 'Reunião Agendada', type: 'number' },
  { key: 'reuniao_realizada', label: 'Reunião Realizada', type: 'number' },
  { key: 'r1', label: 'R1', type: 'number' },
  { key: 'r2', label: 'R2', type: 'number' },
  { key: 'reuniao_ip', label: 'Reuniões IP', type: 'number' },
  { key: 'reuniao_ap', label: 'Reuniões AP', type: 'number' },
  { key: 'pa', label: 'PA (R$)', type: 'number' },
  { key: 'receita_escritorio', label: 'Receita Escritorio (R$)', type: 'number' },
  { key: 'recomendacoes', label: 'Recomendações', type: 'number' },
  { key: 'contas', label: 'Novas contas', type: 'number' },
  { key: 'contas_totais', label: 'Contas totais', type: 'number' },
  { key: 'patrimonio_liquido', label: 'Patrimônio líquido (R$)', type: 'number' },
  { key: 'pipe_proxima_semana', label: 'PIPE próxima semana (R$)', type: 'number' },
  { key: 'pipe_ip', label: 'PIPE IP (R$)', type: 'number' },
  { key: 'pipe_ap', label: 'PIPE AP (R$)', type: 'number' },
];

const TEMPLATE_SAMPLES = [
  ['Rodrigo Valpereiro', '2026-04-06', 734000, '', '', '', 10, 6, '', '', '', 15000, 1, 9, 34, 734000, 500000, 60000, 40000],
  ['Lucas Fortes', '2026-06-08', 235000, '', '', '', 8, 4, '', 2, '', 0, 3, 5, 41, 270000, 300000, 20000, 15000],
];

// Normalize header text for fuzzy matching (lowercase, no accents/punctuation)
const normalize = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const labelMap = {};
FIELDS.forEach(f => { labelMap[normalize(f.label)] = f.key; labelMap[normalize(f.key)] = f.key; });
// Common header aliases seen in hand-edited or exported spreadsheets.
labelMap[normalize('Semana')] = 'week_start';

function toISODate(val) {
  if (!val) return '';
  // Excel serial number
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  // "2026-03-23 00:00:00" → "2026-03-23"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/yyyy
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${String(m2[2]).padStart(2, '0')}-${String(m2[1]).padStart(2, '0')}`;
  return s;
}

function parseSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
        resolve(raw);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function LancamentoImport({ onSaved }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const header = FIELDS.map(f => f.label);
    const ws = XLSX.utils.aoa_to_sheet([header, ...TEMPLATE_SAMPLES]);
    ws['!cols'] = FIELDS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template_lancamento_padawan');
    XLSX.writeFile(wb, 'template_lancamento_padawan.xlsx');
  };

  const handleImport = async () => {
    if (!file) { toast({ title: 'Selecione um arquivo.', variant: 'destructive' }); return; }
    setBusy(true);
    setDone(null);
    try {
      const rows2d = await parseSheet(file);
      if (!rows2d.length) {
        toast({ title: 'Arquivo vazio.', variant: 'destructive' });
        setBusy(false); return;
      }

      // Build header → fieldKey map
      const headers = rows2d[0].map(h => normalize(h));
      const colToKey = headers.map(h => labelMap[h] || null);

      const records = [];
      for (let i = 1; i < rows2d.length; i++) {
        const row = rows2d[i];
        if (!row || row.every(c => c == null || c === '')) continue;
        const rec = {};
        colToKey.forEach((key, idx) => {
          if (!key) return;
          const f = FIELDS.find(x => x.key === key);
          let val = row[idx];
          if (key === 'week_start') { rec[key] = toISODate(val); return; }
          if (f.type === 'number') {
            if (val == null || val === '') { rec[key] = 0; return; }
            const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
            rec[key] = isNaN(n) ? 0 : n;
          } else {
            rec[key] = val != null ? String(val).trim() : '';
          }
        });
        if (rec.assessor && rec.week_start) records.push(rec);
      }

      if (records.length === 0) {
        toast({ title: 'Nenhuma linha válida. Confira os cabeçalhos e as colunas Assessor/Semana.', variant: 'destructive' });
        setBusy(false); return;
      }

      const withPoints = records.map(r => {
        const { total, breakdown } = calcPoints(r);
        return { ...r, total_points: total, breakdown };
      });

      await db.entities.WeeklyEntry.bulkCreate(withPoints);
      setDone(withPoints.length);
      setFile(null);
      toast({ title: `${withPoints.length} lançamento(s) importado(s).` });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Erro ao importar.', description: String(err?.message || err), variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-1">Importar planilha</h2>
      <p className="text-xs text-[#5C7466] mb-6">Baixe o template, preencha no Excel ou Google Sheets e faça upload. A pontuação é calculada automaticamente.</p>

      {/* Step 1 */}
      <Step num={1} title="Baixar o template">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wide text-[#A8E063] border border-[#224030] px-4 py-2.5 rounded-md hover:border-[#A8E063] transition-colors"
        >
          <Download size={15} /> Baixar template Excel
        </button>
        <p className="text-[11px] text-[#5C7466] mt-2">Uma linha por assessor/semana. Apague as linhas de exemplo antes de enviar.</p>
      </Step>

      {/* Step 2 */}
      <Step num={2} title="Selecionar arquivo preenchido">
        <label className="flex items-center gap-2 font-mono text-sm tracking-wide text-[#F3F6F1] bg-[#163524] border border-[#224030] px-4 py-2.5 rounded-md cursor-pointer hover:border-[#A8E063] transition-colors w-fit">
          <Upload size={15} className="text-[#A8E063]" />
          {file ? file.name : 'Escolher arquivo'}
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { setFile(e.target.files[0]); setDone(null); }} />
        </label>
      </Step>

      {/* Step 3 */}
      <Step num={3} title="Importar" last>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleImport}
            disabled={busy || !file}
            className="font-mono text-sm font-semibold tracking-wide bg-[#A8E063] text-[#0A1F16] px-5 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Importando…' : 'Importar lançamentos'}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 font-mono text-sm text-[#A8E063]">
              <Check size={15} /> {done} registro(s) salvo(s)
            </span>
          )}
        </div>
      </Step>

      <div className="mt-6 pt-4 border-t border-[#1A3225]">
        <p className="text-[10.5px] text-[#5C7466] font-mono uppercase tracking-wider mb-2">Colunas aceitas</p>
        <div className="flex flex-wrap gap-1.5">
          {FIELDS.map(f => (
            <span key={f.key} className="font-mono text-[10.5px] text-[#8FA897] bg-[#163524] border border-[#224030] px-2 py-0.5 rounded">
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, children, last }) {
  return (
    <div className={`flex gap-4 ${last ? '' : 'pb-6 mb-6 border-b border-[#1A3225]'}`}>
      <div className="flex flex-col items-center">
        <span className="w-7 h-7 rounded-full bg-[#163524] border border-[#224030] flex items-center justify-center font-mono text-xs font-bold text-[#A8E063] flex-shrink-0">
          {num}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#F3F6F1] mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}
