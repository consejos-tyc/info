
import React, { useState, useEffect } from 'react';
import { INDICATOR_TEMPLATES } from '../constants';
import { dataService } from '../services/dataService';

interface GoalSettingProps {
  stakeId: string;
  onSave: () => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ stakeId, onSave }) => {
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al ser nube, idealmente cargamos las metas actuales. 
    // Por simplificación reutilizamos getIndicatorData que ya trae las metas mergeadas
    const load = async () => {
      setLoading(true);
      const data = await dataService.getIndicatorData(stakeId);
      const initialGoals: Record<string, number> = {};
      data.forEach(d => {
        initialGoals[d.id] = d.goal;
      });
      setGoals(initialGoals);
      setLoading(false);
    };
    load();
  }, [stakeId]);

  const handleGoalChange = (id: string, value: string) => {
    const num = parseFloat(value) || 0;
    setGoals(prev => ({ ...prev, [id]: num }));
  };

  const handleSave = async () => {
    setLoading(true);
    await dataService.saveCustomGoals(stakeId, goals);
    setIsSaved(true);
    setLoading(false);
    setTimeout(() => {
      setIsSaved(false);
      onSave();
    }, 1500);
  };

  if (loading && Object.keys(goals).length === 0) {
    return <div className="p-10 text-center text-[#999]">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-[#333]">Configurar Metas Anuales</h2>
          <p className="text-sm text-[#666]">Defina los objetivos que los consejos de barrio se proponen para alcanzar este año.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {INDICATOR_TEMPLATES.map(template => (
            <div key={template.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-[#333] font-serif">{template.name}</h4>
                  <p className="text-[10px] text-[#666] mt-1">{template.description}</p>
                </div>
                <span className="text-[10px] font-black text-[#002D5A] uppercase bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {template.criteria}
                </span>
              </div>
              <div className="mt-4">
                <label className="block text-[10px] font-bold text-[#999] uppercase mb-1">Nueva Meta {template.id === 'ministracion' ? '(%)' : ''}</label>
                <input
                  type="number"
                  value={goals[template.id] || ''}
                  onChange={(e) => handleGoalChange(template.id, e.target.value)}
                  className="w-full bg-white border border-[#CCC] rounded-sm px-4 py-2 text-lg font-bold text-black focus:border-[#002D5A] outline-none transition-all"
                  placeholder="Ej: 100"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4">
          {isSaved && (
            <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ¡Metas guardadas!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#002D5A] hover:bg-[#003D7A] text-white font-bold py-3 px-8 rounded-sm shadow-lg transition-all active:scale-95 flex items-center gap-2 uppercase text-[12px] tracking-widest disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Metas'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalSetting;
