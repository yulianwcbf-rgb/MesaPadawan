import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '@/components/padawan/AnimatedBackground';
import RankingTab from '@/components/padawan/RankingTab';
import LancamentoTab from '@/components/padawan/LancamentoTab';
import HistoricoTab from '@/components/padawan/HistoricoTab';
import EquipeTab from '@/components/padawan/EquipeTab';
import RegrasTab from '@/components/padawan/RegrasTab';
import AnaliseTab from '@/components/padawan/AnaliseTab';
import PasswordGate from '@/components/PasswordGate';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { key: 'ranking', label: 'Ranking' },
  { key: 'lancamento', label: 'Lançamento' },
  { key: 'historico', label: 'Histórico' },
  { key: 'analise', label: 'Análise' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'regras', label: 'Regras' },
];

export default function Home() {
  const [currentTab, setCurrentTab] = useState('ranking');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
    setCurrentTab('ranking');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-[#F3F6F1] relative" style={{ backgroundColor: '#0A1F16' }}>
      <AnimatedBackground />
      <div className="max-w-[1100px] mx-auto px-5 md:px-6 py-8 pb-20 relative" style={{ zIndex: 1 }}>
        {/* Masthead */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#224030] pb-5 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A8E063] mb-1.5">
              Mesa Padawan
            </p>
            <h1 className="font-heading text-3xl md:text-[34px] font-semibold tracking-tight text-[#F3F6F1]">
              Ranking de Performance
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-[#8FA897]">
            <div>EWZ Capital</div>
            {user?.email && (
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="truncate max-w-[160px] text-[#5C7466]">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-[#8FA897] hover:text-[#A8E063] transition-colors underline-offset-2 hover:underline"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-7 border-b border-[#224030] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`font-mono text-xs tracking-wide px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                currentTab === tab.key
                  ? 'text-[#A8E063] border-[#A8E063]'
                  : 'text-[#8FA897] border-transparent hover:text-[#F3F6F1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentTab === 'ranking' && <RankingTab key={refreshKey} />}
            {currentTab === 'lancamento' && <LancamentoTab onSaved={handleSaved} />}
            {currentTab === 'historico' && <PasswordGate title="Histórico — acesso do líder"><HistoricoTab refreshKey={refreshKey} /></PasswordGate>}
            {currentTab === 'analise' && <PasswordGate title="Análise — acesso do líder"><AnaliseTab refreshKey={refreshKey} /></PasswordGate>}
            {currentTab === 'equipe' && <PasswordGate title="Equipe — acesso do líder"><EquipeTab /></PasswordGate>}
            {currentTab === 'regras' && <RegrasTab />}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[#5C7466] text-[11px] font-mono mt-9">
          EWZ Capital · Mesa Padawan — dados salvos automaticamente
        </p>
      </div>
    </div>
  );
}