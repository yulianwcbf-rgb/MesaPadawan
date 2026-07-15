import { db } from '@/api/base44Client';

import React, { useState, useEffect } from 'react';

import { useToast } from '@/components/ui/use-toast';
import MemberAvatar from '@/components/padawan/MemberAvatar';

export default function EquipeTab() {
  const [team, setTeam] = useState([]);
  const [allTeam, setAllTeam] = useState([]); // includes archived, used to detect re-adds
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const { toast } = useToast();

  const load = async () => {
    const t = await db.entities.TeamMember.list();
    setAllTeam(t);
    setTeam(t.filter(m => !m.archived));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) { toast({ title: 'Digite um nome.', variant: 'destructive' }); return; }
    if (team.some(m => m.name === name)) { toast({ title: 'Esse assessor já está cadastrado.', variant: 'destructive' }); return; }
    const archivedMatch = allTeam.find(m => m.name === name && m.archived);
    if (archivedMatch) {
      await db.entities.TeamMember.update(archivedMatch.id, { archived: false });
      toast({ title: `${name} reativado — foto e tempo de mesa anteriores foram mantidos.` });
    } else {
      await db.entities.TeamMember.create({ name });
      toast({ title: `${name} adicionado à Mesa Padawan.` });
    }
    setNewName('');
    load();
  };

  const handleTempoMesa = async (member, value) => {
    const meses = Math.max(0, parseInt(value, 10) || 0);
    await db.entities.TeamMember.update(member.id, { tempo_mesa_meses: meses });
    setTeam(prev => prev.map(m => m.id === member.id ? { ...m, tempo_mesa_meses: meses } : m));
  };

  const handlePhoto = async (member, file) => {
    if (!file) return;
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      await db.entities.TeamMember.update(member.id, { photo_url: file_url });
      toast({ title: `Foto de ${member.name} atualizada.` });
      load();
    } catch {
      toast({ title: 'Erro ao enviar foto.', variant: 'destructive' });
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remover ${member.name} da equipe? Foto, tempo de mesa e histórico são mantidos — só deixam de aparecer no ranking.`)) return;
    await db.entities.TeamMember.update(member.id, { archived: true });
    setTeam(prev => prev.filter(m => m.id !== member.id));
    setAllTeam(prev => prev.map(m => m.id === member.id ? { ...m, archived: true } : m));
    toast({ title: `${member.name} removido.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#224030] border-t-[#A8E063] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#224030] bg-[#102A1E] p-5 md:p-6">
      <h2 className="font-heading text-lg font-semibold text-[#F3F6F1] mb-4 flex items-baseline gap-2.5">
        Assessores da Mesa Padawan
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8FA897] border border-[#224030] px-1.5 py-0.5 rounded">
          {team.length} pessoa(s)
        </span>
      </h2>

      {team.length === 0 ? (
        <p className="text-sm text-[#8FA897] text-center py-6">Nenhum assessor cadastrado.</p>
      ) : (
        <div className="flex flex-col">
          {team.map(m => (
            <div key={m.id} className="flex items-center justify-between py-3 border-b border-[#1A3225] last:border-b-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <MemberAvatar member={m} size={36} />
                <span className="text-sm font-semibold text-[#F3F6F1] truncate">{m.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-[#5C7466] font-mono">
                  Tempo de mesa
                  <input
                    type="number"
                    min="0"
                    value={m.tempo_mesa_meses || ''}
                    onChange={e => handleTempoMesa(m, e.target.value)}
                    placeholder="0"
                    className="w-14 bg-[#163524] border border-[#224030] text-[#F3F6F1] rounded px-1.5 py-1 font-mono text-xs outline-none focus:border-[#A8E063] transition-colors"
                  />
                  <span>meses</span>
                </label>
                <label className="text-xs text-[#5C7466] hover:text-[#A8E063] transition-colors font-mono cursor-pointer">
                  Foto
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(m, e.target.files[0])} />
                </label>
                <button
                  onClick={() => handleRemove(m)}
                  className="text-xs text-[#5C7466] hover:text-[#F2705C] transition-colors font-mono"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mt-5">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nome do assessor"
          className="flex-1 bg-[#163524] border border-[#224030] text-[#F3F6F1] rounded-md px-2.5 py-2.5 font-mono text-sm outline-none focus:border-[#A8E063] transition-colors placeholder:text-[#5C7466]"
        />
        <button
          onClick={handleAdd}
          className="font-mono text-sm font-semibold tracking-wide bg-[#A8E063] text-[#0A1F16] px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
