import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const PASSWORD = 'AAAaaa123';
const STORAGE_KEY = 'padawan_leader_auth';

export default function PasswordGate({ children, title }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (authed) return children;

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border border-[#224030] bg-[#102A1E] p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Lock className="w-4 h-4 text-[#A8E063]" />
          <h2 className="font-heading text-base font-semibold text-[#F3F6F1]">
            {title || 'Acesso restrito'}
          </h2>
        </div>
        <p className="text-xs text-[#8FA897] mb-4">Esta área é exclusiva do líder da mesa. Digite a senha para continuar.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Senha"
            autoFocus
            className="field-input"
          />
          {error && <p className="text-xs text-[#F2705C] font-mono">Senha incorreta.</p>}
          <button
            type="submit"
            className="font-mono text-sm font-semibold tracking-wide bg-[#A8E063] text-[#0A1F16] px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}