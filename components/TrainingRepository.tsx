
import React from 'react';

// Enlaces actualizados a las carpetas de Drive proporcionadas
const DRIVE_LINKS = {
  GENERAL: 'https://drive.google.com/drive/folders/1S3PXuZQ1MGDbL2BhVUqije373F71R3d7?usp=drive_link',
  LIDERES: 'https://drive.google.com/drive/folders/1Xo2HlFJ8nkvPE75-18vqqYhYyKqNR1dN?usp=drive_link',
  SECRETARIOS: 'https://drive.google.com/drive/folders/1RhGH0x2q5SWmzUDyuC3v5cYHUYqk_JAQ?usp=sharing',
};

const TrainingRepository: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white border border-[#E0E0E0] p-10 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#333] mb-2">Centro de Capacitación</h2>
          <p className="text-[#666]">Recursos, manuales y presentaciones para el fortalecimiento de las estacas.</p>
        </div>
        <div className="bg-blue-50 text-[#002D5A] px-6 py-4 rounded-lg border border-blue-100 flex items-center gap-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest">Almacenamiento Seguro</p>
            <p className="text-sm font-bold">Google Drive Consejos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tarjeta 1 - Presidentes */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden hover:shadow-xl transition-all group">
          <div className="h-32 bg-[#002D5A] flex items-center justify-center">
            <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div className="p-8 text-center">
            <h3 className="text-xl font-serif font-bold text-[#333] mb-3">Liderazgo de Estaca</h3>
            <p className="text-sm text-[#666] mb-8">Manuales para Presidencias, Obispados y líderes de organizaciones.</p>
            <a 
              href={DRIVE_LINKS.LIDERES} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-block bg-white text-[#002D5A] border border-[#002D5A] px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#002D5A] hover:text-white transition-all shadow-sm group-hover:shadow-md"
            >
              Abrir Carpeta
            </a>
          </div>
        </div>

        {/* Tarjeta 2 - Secretarios */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden hover:shadow-xl transition-all group">
          <div className="h-32 bg-[#10b981] flex items-center justify-center">
            <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="p-8 text-center">
            <h3 className="text-xl font-serif font-bold text-[#333] mb-3">Secretarios y Auxiliares</h3>
            <p className="text-sm text-[#666] mb-8">Formatos, plantillas de reportes y guías de auditoría financiera.</p>
            <a 
              href={DRIVE_LINKS.SECRETARIOS} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-block bg-white text-[#10b981] border border-[#10b981] px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-sm group-hover:shadow-md"
            >
              Abrir Carpeta
            </a>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-8 mt-4 text-center">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-800 mb-2">Acceso a Drive Consejos</h4>
        <p className="text-sm text-amber-900 mb-6 max-w-2xl mx-auto">Para ver todos los documentos disponibles en el repositorio centralizado, haga clic a continuación.</p>
        <a 
          href={DRIVE_LINKS.GENERAL} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-2 bg-[#2d3748] text-white px-8 py-4 rounded text-[12px] font-bold uppercase tracking-widest hover:bg-[#1a202c] shadow-lg transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          Abrir Repositorio Completo
        </a>
      </div>
    </div>
  );
};

export default TrainingRepository;
