
import React, { useState, useEffect } from 'react';
import { MONTHS } from '../constants';
import { Indicator, ReportCriteria, Priority } from '../types';

interface DataEntryProps {
  indicators: Indicator[];
  onUpdate: (indicatorId: string, month: string, value: number) => void;
}

const DataEntry: React.FC<DataEntryProps> = ({ indicators, onUpdate }) => {
  const [successMsg, setSuccessMsg] = useState('');
  
  // Estado para el Wizard Móvil
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);

  const handleValueChange = (indicatorId: string, month: string, val: string) => {
    const num = parseFloat(val) || 0;
    onUpdate(indicatorId, month, num);
    setSuccessMsg('¡Guardado!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const groupedIndicators = indicators.reduce((acc, curr) => {
    if (!acc[curr.priority]) acc[curr.priority] = [];
    acc[curr.priority].push(curr);
    return acc;
  }, {} as Record<Priority, Indicator[]>);

  // Cálculo de progreso para el mes seleccionado (Wizard)
  const selectedMonthName = MONTHS[selectedMonthIndex];
  const totalIndicators = indicators.length;
  const filledIndicators = indicators.filter(ind => {
    const val = ind.monthlyValues.find(v => v.month === selectedMonthName)?.value;
    return val !== undefined && val > 0;
  }).length;
  const progressPercent = (filledIndicators / totalIndicators) * 100;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#F0F0F0] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#333]">Reporte de Indicadores</h2>
            <p className="text-sm text-[#666]">Ingrese los valores correspondientes a las metas.</p>
          </div>
          {successMsg && (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-2 animate-bounce">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {successMsg}
            </div>
          )}
        </div>

        {/* VISTA ESCRITORIO (TABLA COMPLETA) - Visible solo en LG o superior */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                <th className="sticky left-0 z-10 bg-[#FAFAFA] p-4 text-[11px] font-black text-[#666] uppercase tracking-widest min-w-[250px] border-r border-[#E0E0E0]">
                  Indicador / Meses
                </th>
                {MONTHS.map(m => (
                  <th key={m} className="p-4 text-[10px] font-black text-[#666] uppercase tracking-widest text-center min-w-[80px] border-r border-[#F0F0F0]">
                    {m.substring(0, 3)}
                  </th>
                ))}
                <th className="p-4 text-[11px] font-black text-[#002D5A] uppercase tracking-widest text-center min-w-[80px] bg-blue-50/50">
                  Meta
                </th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(groupedIndicators) as [string, Indicator[]][]).map(([priority, items]) => (
                <React.Fragment key={priority}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={MONTHS.length + 2} className="px-4 py-2 text-[9px] font-black text-[#002D5A] uppercase tracking-[0.2em] border-y border-[#F0F0F0]">
                      {priority}
                    </td>
                  </tr>
                  {items.map(indicator => (
                    <tr key={indicator.id} className="border-b border-[#F0F0F0] hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-4 border-r border-[#F0F0F0] shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-[#333] leading-tight">{indicator.name}</p>
                          {indicator.helpText && (
                            <div className="group relative">
                              <div className="w-3 h-3 rounded-full bg-slate-200 text-[#666] flex items-center justify-center text-[9px] font-bold cursor-help">?</div>
                              <div className="absolute left-full top-0 ml-2 w-48 bg-[#333] text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                {indicator.helpText}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-[#999] uppercase font-bold mt-1 tracking-tighter">
                          {indicator.criteria === ReportCriteria.Cumulative ? 'Acumulable' : 'Promediable'}
                        </p>
                      </td>
                      {MONTHS.map(month => {
                        const monthValue = indicator.monthlyValues.find(v => v.month === month)?.value || 0;
                        return (
                          <td key={month} className="p-1 border-r border-[#F4F4F4]">
                            <input
                              type="number"
                              defaultValue={monthValue || ''}
                              onBlur={(e) => handleValueChange(indicator.id, month, e.target.value)}
                              placeholder="-"
                              className="w-full bg-transparent px-1 py-3 text-center text-sm font-bold text-[#002D5A] focus:bg-white focus:ring-2 focus:ring-[#002D5A] outline-none rounded transition-all border border-transparent focus:border-[#002D5A]"
                            />
                          </td>
                        );
                      })}
                      <td className="p-4 text-center bg-blue-50/20">
                        <span className="text-[12px] font-black text-[#002D5A] opacity-60">
                          {indicator.goal}{indicator.id === 'ministracion' ? '%' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL (WIZARD POR MES) - Visible en móviles */}
        <div className="lg:hidden bg-[#F9F9F9]">
          
          {/* Selector de Mes (Scroll Horizontal) */}
          <div className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0] shadow-sm">
            <div className="flex overflow-x-auto py-4 px-4 gap-2 no-scrollbar">
              {MONTHS.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonthIndex(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                    idx === selectedMonthIndex 
                      ? 'bg-[#002D5A] text-white shadow-md transform scale-105' 
                      : 'bg-slate-100 text-[#666] hover:bg-slate-200'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
            
            {/* Barra de Progreso del Mes */}
            <div className="px-6 py-3 bg-[#FAFAFA] border-b border-[#F0F0F0] flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-[#002D5A] uppercase tracking-widest whitespace-nowrap">
                Progreso {selectedMonthName}
              </span>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-black text-[#333]">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          <div className="p-4 space-y-8 pb-12">
            {(Object.entries(groupedIndicators) as [string, Indicator[]][]).map(([priority, items]) => (
               <div key={priority} className="animate-slide-up">
                 <div className="flex items-center gap-2 mb-3 px-1">
                   <div className="h-px bg-[#CCC] flex-1"></div>
                   <span className="text-[10px] font-black text-[#999] uppercase tracking-[0.2em]">{priority}</span>
                   <div className="h-px bg-[#CCC] flex-1"></div>
                 </div>
                 
                 <div className="space-y-3">
                   {items.map(indicator => {
                     const monthValue = indicator.monthlyValues.find(v => v.month === selectedMonthName)?.value;
                     const hasValue = monthValue !== undefined && monthValue > 0;
                     
                     return (
                       <div key={indicator.id} className={`bg-white border rounded-lg p-5 transition-all ${hasValue ? 'border-emerald-200 shadow-sm' : 'border-[#E0E0E0] shadow-sm'}`}>
                         <div className="flex justify-between items-start mb-4">
                           <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-[#333] text-[15px] leading-tight">{indicator.name}</h4>
                                {indicator.helpText && (
                                  <div className="group relative flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-blue-100 text-[#002D5A] flex items-center justify-center text-[10px] font-bold cursor-help">?</div>
                                    <div className="absolute left-6 top-0 w-48 bg-[#333] text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                      {indicator.helpText}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-[#999] leading-tight">{indicator.description}</p>
                           </div>
                           <div className="flex flex-col items-end">
                             <div className="bg-blue-50 text-[#002D5A] px-2 py-1 rounded text-[10px] font-black mb-1">
                               Meta: {indicator.goal}{indicator.id === 'ministracion' ? '%' : ''}
                             </div>
                             {hasValue && (
                               <div className="text-emerald-600">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                               </div>
                             )}
                           </div>
                         </div>
                         
                         <div className="relative">
                            <label className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold text-[#002D5A] uppercase tracking-widest">
                              Valor {selectedMonthName}
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              defaultValue={monthValue || ''}
                              onBlur={(e) => handleValueChange(indicator.id, selectedMonthName, e.target.value)}
                              placeholder="0"
                              className="w-full border border-[#DDD] rounded p-3 text-lg font-bold text-[#333] focus:border-[#002D5A] focus:ring-1 focus:ring-[#002D5A] outline-none transition-all placeholder:text-gray-300"
                            />
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            ))}

            {/* Navegación Inferior */}
            <div className="flex justify-between gap-4 pt-6">
              <button 
                onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedMonthIndex === 0}
                className="flex-1 py-3 border border-[#CCC] rounded text-[11px] font-bold uppercase tracking-widest text-[#666] disabled:opacity-30 active:bg-slate-100"
              >
                ← Anterior
              </button>
              <button 
                onClick={() => {
                  setSelectedMonthIndex(prev => Math.min(MONTHS.length - 1, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={selectedMonthIndex === MONTHS.length - 1}
                className="flex-1 py-3 bg-[#002D5A] rounded text-[11px] font-bold uppercase tracking-widest text-white shadow-lg disabled:opacity-50 active:scale-95 transition-all"
              >
                Siguiente Mes →
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded shadow-sm">
        <div className="flex gap-4">
          <div className="text-amber-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-1">Autoguardado Activo:</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Los datos se guardan automáticamente al salir de cada casilla o al presionar "Siguiente".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
