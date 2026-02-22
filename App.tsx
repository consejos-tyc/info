
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MONTHS, STAKES } from './constants';
import { Priority, ReportCriteria, Indicator, User, UserRole } from './types';
import { authService, dataService } from './services/dataService';
import IndicatorChart from './components/IndicatorChart';
import AIChat from './components/AIChat';
import Auth from './components/Auth';
import DataEntry from './components/DataEntry';
import GoalSetting from './components/GoalSetting';
import AdminDashboard from './components/AdminDashboard';
import TrainingRepository from './components/TrainingRepository';

type View = 'landing' | 'indicators' | 'report' | 'goals' | 'rcc' | 'admin' | 'training';

const CAROUSEL_IMAGES = [
  "https://lh3.googleusercontent.com/d/1VUFtmW2JAC_ABl8pP41H70XenE3dZt4A", 
  "https://lh3.googleusercontent.com/d/1qx9c0vyTghqnw_gdb0OHbDLyfoDmmwff",
  "https://lh3.googleusercontent.com/d/1_4Si4nlTn06zuS2T18jx8XMp9qhpVSnT",
  "https://lh3.googleusercontent.com/d/1DX2l2373Y9MvYCnhUeL-L7RJbcXb9Nnc",
  "https://lh3.googleusercontent.com/d/1QVA0oZtTwaA7fXbK4BuLzJX_WI3Vx8gy",
  "https://lh3.googleusercontent.com/d/1Pod5UIRkFKGbw_ye33Tp1wN8oKlsSxT4"
];

const CHURCH_LOGO_URL = "https://lh3.googleusercontent.com/d/1tSPzc8RlTm-Zun3rbxCBjNbIM3iVEP4R";

// Componente Skeleton para carga elegante
const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white border border-gray-100 rounded-lg p-8 h-80 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 skeleton"></div>
          <div className="h-48 bg-gray-100 rounded skeleton"></div>
          <div className="mt-4 flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4 skeleton"></div>
            <div className="h-4 bg-gray-200 rounded w-10 skeleton"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'Todos'>('Todos');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDeregisterConfirm, setShowDeregisterConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load check
  useEffect(() => {
    const checkSession = async () => {
      const activeUser = authService.getLocalSession();
      if (activeUser) {
        setUser(activeUser);
        if (activeUser.role === UserRole.AreaSeventy) {
          setCurrentView('admin');
        } else {
          setLoadingData(true);
          const data = await dataService.getIndicatorData(activeUser.stakeId);
          setIndicators(data);
          setLoadingData(false);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (currentView === 'landing' && CAROUSEL_IMAGES.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % CAROUSEL_IMAGES.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  const handleLogin = async (u: User) => {
    setUser(u);
    if (u.role === UserRole.AreaSeventy) {
      setCurrentView('admin');
    } else {
      setLoadingData(true);
      const data = await dataService.getIndicatorData(u.stakeId);
      setIndicators(data);
      setLoadingData(false);
      setCurrentView('indicators');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIndicators([]);
    setCurrentView('landing');
    setShowProfileModal(false);
  };

  const handleDeregister = async () => {
    if (user) {
      setLoadingData(true);
      await authService.deregister(user.phone);
      setUser(null);
      setIndicators([]);
      setCurrentView('landing');
      setShowDeregisterConfirm(false);
      setShowProfileModal(false);
      setLoadingData(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...user, profileImage: reader.result as string };
        setUser(updatedUser);
        authService.updateUser(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDataUpdate = async (indicatorId: string, month: string, value: number) => {
    if (!user) return;
    
    // Actualización optimista en UI
    const updatedIndicators = indicators.map(ind => {
      if (ind.id === indicatorId) {
        return {
          ...ind,
          monthlyValues: ind.monthlyValues.map(mv => 
            mv.month === month ? { ...mv, value } : mv
          )
        };
      }
      return ind;
    });
    setIndicators(updatedIndicators);

    // Enviar a la nube
    await dataService.updateMonthlyValue(user.stakeId, indicatorId, month, value);
  };

  const filteredData = useMemo(() => {
    if (selectedPriority === 'Todos') return indicators;
    return indicators.filter(item => item.priority === selectedPriority);
  }, [selectedPriority, indicators]);

  const getIndicatorStatus = (indicator: Indicator) => {
    const valuesWithData = indicator.monthlyValues.filter(v => v.value > 0);
    const sum = indicator.monthlyValues.reduce((s, item) => s + item.value, 0);
    const avg = valuesWithData.length > 0 ? sum / valuesWithData.length : 0;
    const current = indicator.criteria === ReportCriteria.Cumulative ? sum : avg;
    const progress = indicator.goal > 0 ? Math.min((current / indicator.goal) * 100, 100) : 0;
    return { current, progress };
  };

  const NavItem = ({ href, label, external, active }: { href: string; label: string; external?: boolean; active?: boolean }) => {
    const baseClass = "text-[13px] font-semibold uppercase tracking-wider px-4 py-2 mx-1 transition-all rounded-md flex items-center";
    const activeClass = active ? "bg-[#002D5A]/10 text-[#002D5A]" : "text-[#555] hover:bg-gray-50 hover:text-[#002D5A]";
    if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={`${baseClass} ${activeClass}`}>{label}</a>;
    return <button onClick={() => setCurrentView(href as View)} className={`${baseClass} ${activeClass}`}>{label}</button>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
      {/* Modal Confirmación de Baja */}
      {showDeregisterConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white p-10 max-w-[450px] w-full text-center rounded-sm shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-red-600 mb-4">Confirmar Baja del Sistema</h3>
            <p className="text-[14px] text-[#666] mb-8 leading-relaxed">
              Al darse de baja, su perfil será eliminado y liberará un cupo para su estaca. 
              <strong> Deberá registrarse nuevamente</strong> si desea acceder al portal en el futuro.
              <br/><br/>
              ¿Desea continuar con la baja de su usuario?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeregister} className="w-full bg-red-600 text-white font-bold py-4 uppercase text-[12px] tracking-widest hover:bg-red-700">Confirmar Baja Definitiva</button>
              <button onClick={() => setShowDeregisterConfirm(false)} className="w-full border border-[#CCC] py-4 text-[12px] font-bold uppercase tracking-widest hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mi Cuenta */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white max-w-[500px] w-full p-8 shadow-2xl rounded-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif font-bold text-[#333]">Mi Perfil</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-[#999] hover:text-[#333]">✕</button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 bg-[#002D5A] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white">
                  {user.profileImage ? (
                    <img src={user.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
              <p className="mt-3 text-[10px] font-bold text-[#002D5A] uppercase tracking-widest">Haga clic para cambiar foto</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-[#999] uppercase mb-1 tracking-widest">Nombre</label>
                <div className="bg-[#F9F9F9] border border-[#EEE] p-3 text-sm font-bold text-[#333]">{user.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#999] uppercase mb-1 tracking-widest">WhatsApp</label>
                  <div className="bg-[#F9F9F9] border border-[#EEE] p-3 text-sm font-bold text-[#333]">{user.phone}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#999] uppercase mb-1 tracking-widest">Unidad</label>
                  <div className="bg-[#F9F9F9] border border-[#EEE] p-3 text-[11px] font-bold text-[#333] uppercase">
                    {user.role === UserRole.AreaSeventy ? '70 de Área' : STAKES.find(s => s.id === user.stakeId)?.name.replace('Estaca ', '')}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#F0F0F0] pt-6 flex flex-col gap-3">
              <button onClick={handleLogout} className="w-full bg-[#002D5A] text-white font-bold py-4 uppercase text-[11px] tracking-widest shadow hover:bg-[#003D7A]">Cerrar Sesión</button>
              <button onClick={() => setShowDeregisterConfirm(true)} className="w-full text-red-500 font-bold py-3 uppercase text-[10px] tracking-widest hover:bg-red-50 rounded">Darse de Baja</button>
            </div>
          </div>
        </div>
      )}

      {/* Header con Glassmorphism */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E0E0E0] sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[80px]">
          <div className="flex items-center h-full gap-2 lg:gap-8">
            <button onClick={() => setCurrentView('landing')} className="flex items-center h-full pr-8 border-r border-[#E0E0E0] py-2 transition-opacity hover:opacity-80">
              <img src={CHURCH_LOGO_URL} alt="Logo Iglesia" className="h-14 w-auto object-contain shrink-0" />
            </button>
            <nav className="hidden lg:flex items-center h-full gap-2">
              <NavItem href="landing" label="Inicio" active={currentView === 'landing'} />
              <NavItem href="training" label="Capacitación" active={currentView === 'training'} />
              {user?.role === UserRole.AreaSeventy ? (
                <NavItem href="admin" label="Consolidado Consejos" active={currentView === 'admin'} />
              ) : user ? (
                <>
                  <NavItem href="indicators" label="Indicadores" active={currentView === 'indicators' || currentView === 'report' || currentView === 'goals'} />
                </>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-[#002D5A] font-bold hidden xl:block text-[11px] uppercase tracking-widest">
            Consejos Tegucigalpa y Comayagüela
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-[12px] font-bold text-[#333] group-hover:text-[#002D5A] transition-colors">{user.name}</p>
                    <p className="text-[9px] text-[#999] uppercase font-bold tracking-widest">Mi Perfil</p>
                  </div>
                  <div className="w-9 h-9 bg-[#002D5A] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm border border-white overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <button onClick={() => setCurrentView('indicators')} className="text-[11px] font-bold uppercase tracking-widest bg-[#002D5A] text-white px-5 py-2.5 rounded shadow-sm hover:bg-[#003D7A] transition-colors">Ingresar</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {currentView === 'landing' && (
          <div className="animate-fade-in">
            <div className="relative h-[750px] w-full overflow-hidden bg-[#002D5A]">
              {CAROUSEL_IMAGES.map((img, index) => (
                <div key={index} className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute inset-0 bg-black/45 z-10"></div>
                  <img src={img} className="w-full h-full object-cover" alt={`Templo Tegucigalpa`} />
                </div>
              ))}
              <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
                <div className="max-w-4xl space-y-12">
                  <div className="inline-block border-y border-white/40 py-3 mb-4">
                     <span className="text-white uppercase tracking-[0.4em] text-[12px] font-bold">Consejos Tegucigalpa y Comayagüela</span>
                  </div>
                  <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight drop-shadow-2xl animate-slide-up">
                    “A diferencia de las instituciones del mundo, que nos enseñan a saber algo, el Evangelio de Jesucristo nos desafía a llegar a ser algo”
                  </h1>
                  <div className="space-y-4">
                    <p className="text-white text-lg md:text-2xl font-serif font-medium drop-shadow-md max-w-2xl mx-auto opacity-95 italic">— Presidente Dallin H. Oaks</p>
                    <p className="text-white/70 text-[9px] md:text-[11px] font-sans uppercase tracking-[0.2em] max-w-2xl mx-auto drop-shadow-sm">Discurso: El desafío de lo que debemos llegar a ser</p>
                  </div>
                  <div className="pt-8">
                    <button onClick={() => setCurrentView('indicators')} className="bg-white text-[#002D5A] font-bold px-14 py-6 rounded-sm shadow-2xl hover:bg-[#F9F9F9] hover:scale-105 transition-all uppercase tracking-[0.2em] text-[14px]">
                      Acceder al Portal
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Dashboard Card */}
                <div 
                  onClick={() => setCurrentView('indicators')}
                  className="bg-white rounded-lg p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_-15px_rgba(0,45,90,0.15)] border border-slate-100 hover:border-[#002D5A]/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002D5A] to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002D5A] group-hover:bg-[#002D5A] group-hover:text-white transition-colors duration-300 shadow-inner">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <span className="text-[#002D5A]/40 group-hover:text-[#002D5A] transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#333] mb-3 group-hover:text-[#002D5A] transition-colors">Dashboard</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4">Visualice el progreso de los indicadores clave y metas de su estaca.</p>
                  <span className="text-[11px] font-bold text-[#002D5A] uppercase tracking-widest border-b-2 border-transparent group-hover:border-[#002D5A]/30 transition-all pb-0.5">Ver Estadísticas</span>
                </div>

                {/* Training Card */}
                <div 
                  onClick={() => setCurrentView('training')}
                  className="bg-white rounded-lg p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_-15px_rgba(0,45,90,0.15)] border border-slate-100 hover:border-[#002D5A]/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
                >
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002D5A] to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                   <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002D5A] group-hover:bg-[#002D5A] group-hover:text-white transition-colors duration-300 shadow-inner">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <span className="text-[#002D5A]/40 group-hover:text-[#002D5A] transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#333] mb-3 group-hover:text-[#002D5A] transition-colors">Capacitación</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4">Acceda al repositorio de recursos para presidentes y secretarios.</p>
                  <span className="text-[11px] font-bold text-[#002D5A] uppercase tracking-widest border-b-2 border-transparent group-hover:border-[#002D5A]/30 transition-all pb-0.5">Explorar Recursos</span>
                </div>

                {/* Plan de Area Card */}
                <a 
                  href="https://centroamerica.laiglesiadejesucristo.org/plandearea" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white rounded-lg p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_-15px_rgba(0,45,90,0.15)] border border-slate-100 hover:border-[#002D5A]/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group relative overflow-hidden block"
                >
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002D5A] to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                   <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002D5A] group-hover:bg-[#002D5A] group-hover:text-white transition-colors duration-300 shadow-inner">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-[#002D5A]/40 group-hover:text-[#002D5A] transition-colors duration-300">
                      <svg className="w-6 h-6 transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#333] mb-3 group-hover:text-[#002D5A] transition-colors">Plan de Área</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4">Consulte sobre el plan y vea recursos adicionales para este año.</p>
                  <span className="text-[11px] font-bold text-[#002D5A] uppercase tracking-widest border-b-2 border-transparent group-hover:border-[#002D5A]/30 transition-all pb-0.5">Sitio Oficial</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {currentView === 'indicators' && !user && (
          <div className="py-20 bg-white"><Auth onLogin={handleLogin} /></div>
        )}

        {currentView === 'admin' && user?.role === UserRole.AreaSeventy && (
          <div className="max-w-7xl mx-auto px-4 py-12"><AdminDashboard /></div>
        )}

        {currentView === 'training' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <TrainingRepository />
          </div>
        )}

        {(currentView === 'indicators' || currentView === 'report' || currentView === 'goals') && user && user.role === UserRole.StakeLeader && (
          <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
             <div className="bg-white border border-[#E0E0E0] p-10 mb-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm rounded-lg no-print">
              <div>
                <div className="text-[#002D5A] uppercase tracking-widest text-[11px] font-bold mb-2">Administración de Estaca</div>
                <h2 className="text-4xl font-serif font-bold text-[#333] mb-3">{STAKES.find(s => s.id === user.stakeId)?.name}</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setCurrentView('goals')} className="text-[12px] font-bold uppercase tracking-widest border border-[#002D5A] text-[#002D5A] px-8 py-4 hover:bg-[#002D5A] hover:text-white transition-all shadow-sm">Configurar Metas</button>
                <button onClick={() => setCurrentView('report')} className="text-[12px] font-bold uppercase tracking-widest bg-[#002D5A] text-white px-8 py-4 hover:bg-[#003D7A] transition-all shadow-lg">Reportar Mes</button>
              </div>
            </div>
            {loadingData ? (
              <DashboardSkeleton />
            ) : currentView === 'indicators' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {filteredData.map(indicator => {
                      const { current, progress } = getIndicatorStatus(indicator);
                      return (
                        <div key={indicator.id} className="bg-white border border-[#E0E0E0] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg print-break-avoid">
                          <div className="p-8 border-b border-[#F0F0F0]">
                             <h3 className="font-bold text-[#333] text-xl leading-tight font-serif mb-4">{indicator.name}</h3>
                             <IndicatorChart indicator={indicator} type={chartType} />
                          </div>
                          <div className="bg-[#FAFAFA] px-8 py-5 flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#666] uppercase tracking-widest">Progreso Anual</span>
                            <span className="text-[12px] font-black text-[#333]">{progress.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lg:col-span-4 no-print"><AIChat data={indicators} /></div>
              </div>
            ) : currentView === 'report' ? (
               <DataEntry indicators={indicators} onUpdate={handleDataUpdate} />
            ) : currentView === 'goals' ? (
               <GoalSetting stakeId={user.stakeId} onSave={() => setCurrentView('indicators')} />
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
