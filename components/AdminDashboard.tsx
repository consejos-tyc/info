
import React, { useState, useMemo, useEffect } from 'react';
import { STAKES, INDICATOR_TEMPLATES, MONTHS } from '../constants';
import { authService, dataService } from '../services/dataService';
import { ReportCriteria, Priority, Indicator, User, Stake, CalculationType } from '../types';
import IndicatorChart from './IndicatorChart';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

type AdminView = 'overview' | 'comparison' | 'reminders' | 'users' | 'stake-detail' | 'config' | 'consolidated';

interface EnrichedStake extends Stake {
  avgProgress: number;
  indicators: (Indicator & { current: number, progress: number })[];
  users: User[];
  hasReported: boolean;
}

// Hook simple para animación de conteo
const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const val = useCountUp(value);
  return <span>{val.toFixed(1)}</span>;
};

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [selectedStakeId, setSelectedStakeId] = useState<string | null>(null);
  const [selectedCouncil, setSelectedCouncil] = useState<'All' | 'Tegucigalpa' | 'Comayagüela'>('All');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(INDICATOR_TEMPLATES[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [enrichedStakes, setEnrichedStakes] = useState<EnrichedStake[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [rawGoals, setRawGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Anual');

  // Claves editables
  const [editableKeys, setEditableKeys] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const currentMonth = MONTHS[new Date().getMonth()];

  // Carga inicial masiva de datos desde la nube
  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      
      const res = await dataService.getAdminConsolidatedData();
      
      if (!res || !res.users) {
        setIsLoading(false);
        return; 
      }
      
      const dbUsers = res.users as User[];
      setAllUsersList(dbUsers);

      const dbValues = res.rawData || []; 
      const dbGoals = res.rawGoals || []; 
      
      setRawData(dbValues);
      setRawGoals(dbGoals);
      setIsLoading(false);
    };

    loadAdminData();

    const loadKeys = async () => {
      const custom = await authService.getCustomStakeKeys();
      const initial: Record<string, string> = {};
      STAKES.forEach(s => {
        initial[s.id] = custom[s.id] || s.accessKey;
      });
      setEditableKeys(initial);
    };
    
    loadKeys();

  }, [currentMonth]);

  // Procesamiento reactivo de datos
  useEffect(() => {
    if (isLoading) return;

    const processedStakes = STAKES.map(stake => {
      const stakeValues = rawData.filter((r: any[]) => r[0] === stake.id);
      const stakeGoals = rawGoals.filter((r: any[]) => r[0] === stake.id);
      const stakeUsers = allUsersList.filter((u: User) => u.stakeId === stake.id);

      let totalProgress = 0;
      const indicators = INDICATOR_TEMPLATES.map(template => {
          const customGoalRow = stakeGoals.find((r: any[]) => r[1] === template.id);
          const goal = customGoalRow ? Number(customGoalRow[2]) : template.goal;

          const monthlyValues = MONTHS.map(m => {
              const found = stakeValues.find((v: any[]) => v[1] === template.id && v[2] === m);
              return { month: m, value: found ? Number(found[3]) : 0 };
          });

          // Lógica de cálculo según periodo seleccionado
          let current = 0;
          
          if (selectedPeriod === 'Anual') {
            const sum = monthlyValues.reduce((s, m) => s + m.value, 0);
            const valuesWithData = monthlyValues.filter(v => v.value > 0);
            const avg = valuesWithData.length > 0 ? sum / valuesWithData.length : 0;
            const lastValue = valuesWithData.length > 0 ? valuesWithData[valuesWithData.length - 1].value : 0;

            if (template.calculationType === CalculationType.Sum) {
                current = sum;
            } else if (template.calculationType === CalculationType.Average) {
                current = avg;
            } else {
                // Cumulative / Snapshot: Último valor reportado del año
                current = lastValue;
            }
          } else {
            // Periodo Específico (Mes)
            const monthData = monthlyValues.find(v => v.month === selectedPeriod);
            current = monthData ? monthData.value : 0;
          }

          const progress = goal > 0 ? (current / goal) * 100 : 0;
          
          totalProgress += Math.min(progress, 100);

          return { ...template, monthlyValues, goal, current, progress };
      });

      const hasReportedThisMonth = indicators.some(ind => {
          const val = ind.monthlyValues.find(v => v.month === currentMonth)?.value;
          return val !== undefined && val > 0;
      });

      return {
          ...stake,
          avgProgress: indicators.length > 0 ? totalProgress / indicators.length : 0,
          indicators,
          users: stakeUsers,
          hasReported: hasReportedThisMonth
      };
    });

    setEnrichedStakes(processedStakes);
  }, [rawData, rawGoals, allUsersList, selectedPeriod, currentMonth, isLoading]);

  const handleUpdateKey = (stakeId: string, newKey: string) => {
    setEditableKeys(prev => ({ ...prev, [stakeId]: newKey }));
  };

  const saveKey = async (stakeId: string) => {
    setSavingKey(stakeId);
    await authService.saveStakeKey(stakeId, editableKeys[stakeId]); // Cloud + Local
    setTimeout(() => {
      setSavingKey(null);
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  const displayUsers = useMemo(() => {
    const usersWithContext = allUsersList.map(u => {
      const stake = STAKES.find(s => s.id === u.stakeId);
      return {
        ...u,
        stakeName: stake?.name || 'Desconocido',
        council: stake?.council || 'N/A'
      };
    });

    return usersWithContext.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.stakeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCouncil = selectedCouncil === 'All' || u.council === selectedCouncil;
      return matchesSearch && matchesCouncil;
    });
  }, [allUsersList, searchTerm, selectedCouncil]);

  const filteredStakes = useMemo(() => {
    if (selectedCouncil === 'All') return enrichedStakes;
    return enrichedStakes.filter(s => s.council === selectedCouncil);
  }, [enrichedStakes, selectedCouncil]);

  const comparisonData = useMemo(() => {
    return filteredStakes.map(s => {
      const ind = s.indicators.find(i => i.id === selectedIndicatorId);
      return {
        name: s.name.replace('Estaca ', '').replace('Distrito ', ''),
        valor: ind?.current || 0,
        meta: ind?.goal || 0,
        porcentaje: ind?.progress || 0
      };
    }).sort((a, b) => b.porcentaje - a.porcentaje);
  }, [filteredStakes, selectedIndicatorId]);

  const consolidatedData = useMemo(() => {
    const councils = ['Tegucigalpa', 'Comayagüela'];
    return councils.map(council => {
      const stakes = enrichedStakes.filter(s => s.council === council);
      
      const indicators = INDICATOR_TEMPLATES.map(template => {
        let totalGoal = 0;
        let totalCurrent = 0;
        
        stakes.forEach(stake => {
          const ind = stake.indicators.find(i => i.id === template.id);
          if (ind) {
             totalGoal += ind.goal;
             totalCurrent += ind.current;
          }
        });

        // Ajuste especial para porcentajes (Ministración)
        if (template.id === 'ministracion') {
           const validStakes = stakes.filter(s => {
               const i = s.indicators.find(ind => ind.id === template.id);
               return i && i.goal > 0;
           });
           totalGoal = validStakes.length > 0 ? totalGoal / validStakes.length : 0;
           totalCurrent = validStakes.length > 0 ? totalCurrent / validStakes.length : 0;
        }

        const progress = totalGoal > 0 ? (totalCurrent / totalGoal) * 100 : 0;
        return { ...template, goal: totalGoal, current: totalCurrent, progress };
      });

      return { council, indicators };
    });
  }, [enrichedStakes]);

  const sendReminder = (user: User, stakeName: string) => {
    const message = `Estimado(a) ${user.name}, le saludamos de los Consejos. Notamos que la ${stakeName} aún no ha reportado los indicadores de ${currentMonth}. ¿Podría apoyarnos con la actualización de los datos? Muchas gracias.`;
    const phoneStr = String(user.phone || '');
    const url = `https://wa.me/504${phoneStr.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const removeUser = async (phone: string) => {
    if (window.confirm('¿Está seguro de eliminar a este usuario permanentemente del sistema?')) {
        const previousUsers = [...allUsersList];
        setAllUsersList(prev => prev.filter(u => u.phone !== phone));
        
        try {
          const res = await authService.deleteUser(phone);
          if (res.error) {
             throw new Error(res.error);
          }
          setEnrichedStakes(prev => prev.map(s => ({
            ...s,
            users: s.users.filter(u => u.phone !== phone)
          })));
        } catch (error) {
          console.error(error);
          alert('Error al eliminar usuario en la nube.');
          setAllUsersList(previousUsers); 
        }
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-12 h-12 border-4 border-[#002D5A] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#002D5A] font-bold uppercase tracking-widest text-xs">Cargando datos de los consejos...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header Pro */}
      <div className="bg-[#002D5A] p-8 text-white rounded-lg shadow-xl relative overflow-hidden print-break-avoid">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-serif font-bold">Consolidado Consejos</h2>
            <p className="opacity-70 font-serif italic">Administración de Consejos Tegucigalpa y Comayagüela</p>
          </div>
          
          <div className="flex flex-wrap gap-3 no-print">
            <button onClick={() => setActiveView('overview')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'overview' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Semáforo</button>
            <button onClick={() => setActiveView('consolidated')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'consolidated' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Consolidado</button>
            <button onClick={() => setActiveView('comparison')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'comparison' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Comparativa</button>
            <button onClick={() => setActiveView('reminders')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'reminders' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Reportes</button>
            <button onClick={() => setActiveView('users')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'users' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Usuarios</button>
            <button onClick={() => setActiveView('config')} className={`px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'config' ? 'bg-white text-[#002D5A]' : 'bg-white/10 hover:bg-white/20'}`}>Claves</button>
          </div>
        </div>
      </div>

      {/* VISTA CONSOLIDADA */}
      {activeView === 'consolidated' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white border border-[#E0E0E0] p-6 rounded-lg flex items-center justify-between gap-4 no-print">
             <div className="flex gap-4 items-center">
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-widest">Periodo de Análisis:</span>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-[#F4F4F4] px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-[#002D5A] outline-none border border-transparent focus:border-[#002D5A]"
              >
                <option value="Anual">Anual (Acumulado)</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {consolidatedData.map(data => (
            <div key={data.council} className="bg-white border border-[#E0E0E0] p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-serif font-bold text-[#333] mb-6 border-b pb-4">Consolidado Consejo {data.council}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.indicators.map(ind => (
                  <div key={ind.id} className="bg-slate-50 p-6 rounded border border-slate-100">
                    <h4 className="font-bold text-[#333] text-sm mb-2 h-10 flex items-center">{ind.name}</h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#999] tracking-widest">Meta Total</p>
                        <p className="text-xl font-bold text-[#002D5A]">{ind.goal.toLocaleString('es-HN', { maximumFractionDigits: 1 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-[#999] tracking-widest">Real</p>
                        <p className={`text-xl font-bold ${ind.progress >= 100 ? 'text-emerald-600' : 'text-[#333]'}`}>{ind.current.toLocaleString('es-HN', { maximumFractionDigits: 1 })}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(ind.progress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${ind.progress >= 80 ? 'bg-emerald-500' : ind.progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(ind.progress, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISTA DE USUARIOS */}
      {activeView === 'users' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white border border-[#E0E0E0] p-8 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#333]">Directorio de Líderes Registrados</h3>
                <p className="text-sm text-[#666]">Gestione los accesos y contactos de los secretarios de estaca.</p>
              </div>
              <input 
                type="text"
                placeholder="Buscar por nombre o estaca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#F9F9F9] border border-[#DDD] px-4 py-2 rounded text-sm w-full md:w-64 outline-none focus:border-[#002D5A]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest">Líder</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest">Estaca / Distrito</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest text-center">WhatsApp</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.length > 0 ? displayUsers.map(u => (
                    <tr key={u.id} className="border-b border-[#F0F0F0] hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#002D5A] text-white rounded-full flex items-center justify-center text-xs font-bold overflow-hidden">
                            {u.profileImage ? <img src={u.profileImage} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#333] text-sm">{u.name}</p>
                            <p className="text-[10px] text-[#999] uppercase font-bold tracking-tight">Registrado</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-[#444]">{u.stakeName}</p>
                        <p className="text-[10px] text-[#999] uppercase font-bold">{u.council}</p>
                      </td>
                      <td className="p-4 text-center">
                        <a href={`https://wa.me/504${String(u.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 text-[#128C7E] rounded-full text-[11px] font-bold hover:bg-[#25D366] hover:text-white transition-all">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.092 3.393l-.715 2.614 2.678-.703c.832.536 1.82.853 2.879.853a5.772 5.772 0 005.767-5.767 5.772 5.772 0 00-5.634-5.757zm0 1.05c2.61 0 4.717 2.106 4.717 4.717s-2.107 4.717-4.717 4.717c-1.11 0-2.112-.384-2.895-1.025l-1.637.428.434-1.585a4.707 4.707 0 01-1.066-2.903c0-2.611 2.107-4.717 4.717-4.717z"/></svg>
                          {u.phone}
                        </a>
                      </td>
                      <td className="p-4 text-center">
                         <button onClick={() => removeUser(u.phone)} className="p-2 text-rose-500 hover:bg-rose-50 rounded transition-all" title="Eliminar usuario">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-[#999] italic">No se encontraron líderes registrados con los filtros actuales.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE CONFIGURACIÓN DE CLAVES */}
      {activeView === 'config' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white border border-[#E0E0E0] p-8 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#333] mb-2">Editor de Claves Consejos</h3>
                <p className="text-sm text-[#666]">Modifique las claves de acceso para cada unidad.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {STAKES.sort((a,b) => a.council.localeCompare(b.council)).map(stake => (
                <div key={stake.id} className="flex items-center gap-4 p-4 border-b border-[#F0F0F0] hover:bg-slate-50 transition-all">
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-1">{stake.council}</p>
                    <p className="text-[14px] font-bold text-[#333]">{stake.name}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="text" value={editableKeys[stake.id] || ''} onChange={(e) => handleUpdateKey(stake.id, e.target.value)} className="bg-white border border-[#CCC] px-3 py-2 text-[13px] font-mono font-bold w-36 focus:border-[#002D5A] outline-none rounded shadow-sm" />
                    <button onClick={() => saveKey(stake.id)} disabled={savingKey === stake.id} className={`p-2 rounded transition-all ${savingKey === stake.id ? 'bg-emerald-500 text-white' : 'bg-[#002D5A] text-white hover:bg-[#003D7A]'}`}>
                      {savingKey === stake.id ? <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE RECORDATORIOS */}
      {activeView === 'reminders' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-[#E0E0E0] p-8 rounded-lg shadow-sm">
            <h3 className="text-xl font-serif font-bold text-[#333] mb-2">Estado de Reportes - {currentMonth}</h3>
            <p className="text-sm text-[#666] mb-8">Lista de unidades y su cumplimiento para el mes actual.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest">Unidad</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest text-center">Estado</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest text-center">Líderes</th>
                    <th className="p-4 text-[11px] font-black text-[#666] uppercase tracking-widest text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedStakes.map(stake => (
                    <tr key={stake.id} className="border-b border-[#F0F0F0] hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-[#333]">{stake.name}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stake.hasReported ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {stake.hasReported ? 'Reportado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center -space-x-2">
                          {stake.users.length > 0 ? stake.users.map(u => (
                            <div key={u.id} className="w-7 h-7 rounded-full border-2 border-white bg-[#002D5A] text-white flex items-center justify-center text-[10px] font-bold" title={u.name}>{u.profileImage ? <img src={u.profileImage} className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0)}</div>
                          )) : <span className="text-[10px] text-[#999] uppercase font-bold italic">Sin registros</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {stake.users.length > 0 && !stake.hasReported && (
                          <div className="flex justify-end gap-2">
                            {stake.users.map(u => (
                              <button key={u.id} onClick={() => sendReminder(u, stake.name)} className="bg-[#25D366] text-white p-2 rounded hover:bg-[#128C7E] shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase">Recordar</button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE SEMÁFORO / OVERVIEW */}
      {activeView === 'overview' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E0E0E0] p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            <div className="flex gap-4 items-center">
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-widest">Periodo:</span>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-[#F4F4F4] px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-[#002D5A] outline-none border border-transparent focus:border-[#002D5A]"
              >
                <option value="Anual">Anual (Acumulado)</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-[11px] font-bold text-[#999] uppercase tracking-widest">Filtrar Consejo:</span>
              <div className="flex bg-[#F4F4F4] p-1 rounded">
                {['All', 'Tegucigalpa', 'Comayagüela'].map(c => (
                  <button key={c} onClick={() => setSelectedCouncil(c as any)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${selectedCouncil === c ? 'bg-white text-[#002D5A] shadow-sm' : 'text-[#666]'}`}>
                    {c === 'All' ? 'Todos' : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> +80% Logro</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> 50-80% Logro</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full"></div> -50% Logro</div>
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-[#E0E0E0] rounded-lg shadow-sm print-break-avoid">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                  <th className="p-4 text-[11px] font-black text-[#333] uppercase tracking-widest">Unidad</th>
                  {INDICATOR_TEMPLATES.map(t => (
                    <th key={t.id} className="p-4 text-[9px] font-black text-[#666] uppercase tracking-tighter text-center max-w-[100px] leading-tight">
                      {t.name.split(' ').slice(0, 2).join(' ')}...
                    </th>
                  ))}
                  <th className="p-4 text-[11px] font-black text-[#002D5A] uppercase tracking-widest text-center">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {filteredStakes.map(stake => (
                  <tr key={stake.id} className="border-b border-[#F0F0F0] hover:bg-slate-50 transition-colors print-break-avoid">
                    <td className="p-4 font-serif font-bold text-[#333] border-r border-[#F0F0F0]">
                      {stake.name}
                      <span className="block text-[9px] font-bold text-[#999] tracking-widest uppercase">{stake.council}</span>
                    </td>
                    {stake.indicators.map(ind => (
                      <td key={ind.id} className="p-4 text-center">
                        <div className={`inline-flex flex-col items-center justify-center w-16 h-14 rounded-lg text-[10px] font-black border transition-transform hover:scale-105 cursor-help ${ind.progress >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ind.progress >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`} title={`${ind.name}`}>
                          <div className="flex justify-between w-full px-1 opacity-70 text-[8px]">
                             <span>M:{ind.goal}</span>
                          </div>
                          <span className="text-[12px]">{ind.current.toFixed(0)}</span>
                          <span className="text-[9px] opacity-70 border-t border-black/10 w-full pt-0.5 mt-0.5">{Math.round(ind.progress)}%</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-center border-l border-[#F0F0F0]">
                      <span className={`text-lg font-bold ${stake.avgProgress >= 80 ? 'text-emerald-600' : 'text-[#002D5A]'}`}>
                        <AnimatedNumber value={stake.avgProgress} />%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA COMPARATIVA */}
      {activeView === 'comparison' && (
        <div className="space-y-8 animate-fade-in print-break-avoid">
          <div className="bg-white border border-[#E0E0E0] p-8 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 no-print">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#333]">Análisis Comparativo por Indicador</h3>
                <p className="text-sm text-[#666]">Ranking de consejos según el indicador seleccionado.</p>
              </div>
              <select value={selectedIndicatorId} onChange={(e) => setSelectedIndicatorId(e.target.value)} className="bg-[#F9FBFF] border border-[#002D5A]/20 px-4 py-3 rounded text-sm font-bold text-[#002D5A] outline-none min-w-[300px]">
                {INDICATOR_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="h-[600px] w-full mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#EEE" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={150} fontSize={12} fontWeight="bold" tick={{ fill: '#333' }} />
                  <Tooltip cursor={{ fill: '#F0F4F8' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#002D5A] text-white p-4 shadow-2xl rounded-sm border border-white/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Unidad {data.name}</p>
                            <p className="text-xl font-bold">{data.porcentaje.toFixed(1)}% de Logro</p>
                            <p className="text-[11px] mt-2 border-t border-white/10 pt-2">Valor: {data.valor.toFixed(1)} / Meta: {data.meta}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} barSize={32}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.porcentaje >= 80 ? '#10b981' : entry.porcentaje >= 50 ? '#002D5A' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ACCESO RÁPIDO A DETALLE */}
      <section className="bg-white border border-[#E2E8F0] p-10 rounded-lg text-center shadow-sm no-print">
        <h3 className="text-xl font-serif font-bold text-[#333] mb-4">Ver detalle individual de estaca</h3>
        <p className="text-[#666] mb-8 max-w-xl mx-auto">Seleccione para ver históricos mensuales y análisis individual.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {STAKES.map(s => (
            <button key={s.id} onClick={() => { setSelectedStakeId(s.id); setActiveView('stake-detail'); }} className="bg-[#FAFAFA] border border-[#E0E0E0] p-3 text-[10px] font-black uppercase tracking-widest text-[#002D5A] hover:bg-[#002D5A] hover:text-white hover:scale-105 transition-all shadow-sm rounded">
              {s.name.replace('Estaca ', '').replace('Distrito ', '')}
            </button>
          ))}
        </div>
      </section>

      {/* MODAL DETALLE */}
      {activeView === 'stake-detail' && selectedStakeId && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F4F4F4] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl p-8 relative">
            <button onClick={() => setActiveView('overview')} className="absolute top-6 right-6 text-[#999] hover:text-[#333] text-2xl no-print">✕</button>
            <div className="mb-10">
              <span className="text-[11px] font-bold text-[#002D5A] uppercase tracking-[0.3em]">Auditoría Consejos</span>
              <h2 className="text-3xl font-serif font-bold text-[#333]">{STAKES.find(s => s.id === selectedStakeId)?.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-break-avoid">
              {enrichedStakes.find(s => s.id === selectedStakeId)?.indicators.map(ind => (
                <div key={ind.id} className="bg-white p-6 border border-[#E0E0E0] rounded shadow-sm print-break-avoid">
                  <h4 className="font-bold mb-4 text-[#333] font-serif">{ind.name}</h4>
                  <IndicatorChart indicator={ind} type="bar" />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center no-print">
                <button onClick={handlePrint} className="bg-[#002D5A] text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-[#003D7A]">Imprimir Reporte Individual</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
