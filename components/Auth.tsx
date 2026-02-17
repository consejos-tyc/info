
import React, { useState } from 'react';
import { STAKES } from '../constants';
import { authService } from '../services/dataService';
import { User, UserRole } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Logo actualizado desde Google Drive
const CHURCH_LOGO_URL = "https://lh3.googleusercontent.com/d/1tSPzc8RlTm-Zun3rbxCBjNbIM3iVEP4R";

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'role' | 'council' | 'details' | 'seventy'>('role');
  const [council, setCouncil] = useState<'Tegucigalpa' | 'Comayagüela' | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [stakeId, setStakeId] = useState('');
  const [stakeKey, setStakeKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginByStakeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeId) return setError('Seleccione su estaca/distrito');
    if (!stakeKey) return setError('Ingrese la clave de su estaca');
    if (phone.length < 8) return setError('Ingrese un número de contacto válido');
    
    setError('');
    setIsLoading(true);
    
    // Check key locally first for speed
    const isValid = authService.verifyStakeKey(stakeId, stakeKey);
    
    if (isValid) {
      // Check cloud user or register
      const existingUser = await authService.getUser(phone);
      
      if (existingUser) {
        onLogin(existingUser);
      } else {
        const { user, error: regError } = await authService.register(phone, stakeId, name);
        if (regError) {
          setError(regError);
          setIsLoading(false);
        } else if (user) {
          onLogin(user);
        }
      }
    } else {
      setError('La clave de estaca es incorrecta. Solicítela a su Secretario de Estaca.');
      setIsLoading(false);
    }
  };

  const handleSeventyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { user, error: loginError } = authService.loginSeventy(phone, password);
    if (loginError) setError(loginError);
    else if (user) onLogin(user);
  };

  return (
    <div className="flex items-center justify-center px-4 py-10 bg-[#F4F4F4]">
      <div className="max-w-[550px] w-full bg-white border border-[#E0E0E0] p-10 shadow-2xl rounded-sm">
        
        <div className="text-center mb-10">
          <img src={CHURCH_LOGO_URL} alt="Logo Iglesia" className="h-20 w-auto mx-auto mb-6 object-contain drop-shadow-md" />
          <h2 className="text-2xl font-serif font-bold text-[#333] mb-2">Consejos Tegucigalpa y Comayagüela</h2>
          <p className="text-[11px] text-[#666] uppercase tracking-[0.2em] font-bold">Portal de Indicadores Consejos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {step === 'role' && (
          <div className="space-y-4">
            <p className="text-center text-[13px] text-[#666] mb-6">Seleccione su Llamamiento para continuar</p>
            <button 
              onClick={() => setStep('council')}
              className="w-full flex items-center justify-between p-6 bg-[#FAFAFA] border border-[#E0E0E0] hover:border-[#002D5A] hover:bg-white transition-all group"
            >
              <div className="text-left">
                <p className="font-bold text-[#002D5A] uppercase text-[12px] tracking-widest">Líder de estaca / Distrito</p>
              </div>
              <svg className="w-5 h-5 text-[#CCC] group-hover:text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button 
              onClick={() => setStep('seventy')}
              className="w-full flex items-center justify-between p-6 bg-[#FAFAFA] border border-[#E0E0E0] hover:border-[#002D5A] hover:bg-white transition-all group"
            >
              <div className="text-left">
                <p className="font-bold text-[#002D5A] uppercase text-[12px] tracking-widest">Setenta de Área</p>
              </div>
              <svg className="w-5 h-5 text-[#CCC] group-hover:text-[#002D5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {step === 'council' && (
          <div className="animate-fade-in">
             <button onClick={() => setStep('role')} className="text-[10px] font-bold text-[#999] uppercase hover:text-[#002D5A] mb-6 flex items-center gap-1">← Volver</button>
             <h3 className="text-center font-serif font-bold mb-6 text-[#333]">¿A qué consejo pertenece su estaca?</h3>
             <div className="grid grid-cols-1 gap-4">
                <button onClick={() => { setCouncil('Tegucigalpa'); setStep('details'); }} className="p-8 border border-[#E0E0E0] hover:border-[#002D5A] hover:bg-blue-50/30 transition-all text-center rounded-sm">
                  <span className="block font-bold uppercase tracking-widest text-[#002D5A]">Consejo Tegucigalpa</span>
                </button>
                <button onClick={() => { setCouncil('Comayagüela'); setStep('details'); }} className="p-8 border border-[#E0E0E0] hover:border-[#002D5A] hover:bg-blue-50/30 transition-all text-center rounded-sm">
                  <span className="block font-bold uppercase tracking-widest text-[#002D5A]">Consejo Comayagüela</span>
                </button>
             </div>
          </div>
        )}

        {step === 'details' && council && (
          <form onSubmit={handleLoginByStakeKey} className="animate-fade-in space-y-5">
            <button onClick={() => setStep('council')} className="text-[10px] font-bold text-[#999] uppercase hover:text-[#002D5A] mb-2 flex items-center gap-1">← Cambiar Consejo</button>
            <div>
              <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5 tracking-wider">Su Estaca o Distrito</label>
              <select required value={stakeId} onChange={e => setStakeId(e.target.value)} className="w-full bg-white text-black border border-[#AAA] px-4 py-3 text-[14px] outline-none focus:border-[#002D5A]">
                <option value="">Seleccione...</option>
                {STAKES.filter(s => s.council === council).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5 tracking-wider">Nombre Completo</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hno. Martínez" className="w-full bg-white text-black border border-[#AAA] px-4 py-3 text-[14px] outline-none focus:border-[#002D5A]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5 tracking-wider">Teléfono de Contacto</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0000-0000" className="w-full bg-white text-black border border-[#AAA] px-4 py-3 text-[14px] outline-none focus:border-[#002D5A]" />
            </div>
            <div className="bg-blue-50 p-4 border-l-4 border-[#002D5A] mb-2">
              <label className="block text-[11px] font-bold text-[#002D5A] uppercase mb-1.5 tracking-wider">Clave de Acceso de Estaca</label>
              <input 
                type="password" 
                required 
                value={stakeKey} 
                onChange={e => setStakeKey(e.target.value)} 
                placeholder="Ingrese la clave autorizada" 
                className="w-full bg-white text-black border border-[#002D5A]/30 px-4 py-3 text-[14px] font-bold outline-none focus:border-[#002D5A]" 
              />
              <p className="text-[10px] text-[#666] mt-2 italic">Solicite esta clave a su Presidencia de Estaca o Secretario.</p>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-[#002D5A] text-white font-bold py-4 uppercase text-[12px] tracking-widest hover:bg-[#003D7A] shadow-lg transition-all">
              {isLoading ? 'Verificando...' : 'Ingresar al Portal'}
            </button>
          </form>
        )}

        {step === 'seventy' && (
          <form onSubmit={handleSeventyLogin} className="animate-fade-in space-y-6">
             <button onClick={() => setStep('role')} className="text-[10px] font-bold text-[#999] uppercase hover:text-[#002D5A] mb-2 flex items-center gap-1">← Volver</button>
             <h3 className="text-center font-serif font-bold text-xl text-[#333]">Acceso Consejos</h3>
             <div>
               <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5 tracking-wider">Número Registrado</label>
               <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="3333-4444" className="w-full bg-white text-black border border-[#AAA] px-4 py-3 text-[14px] outline-none focus:border-[#002D5A]" />
             </div>
             <div>
               <label className="block text-[11px] font-bold text-[#333] uppercase mb-1.5 tracking-wider">Contraseña Maestra</label>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white text-black border border-[#AAA] px-4 py-3 text-[14px] outline-none focus:border-[#002D5A]" />
             </div>
             <button type="submit" className="w-full bg-[#002D5A] text-white font-bold py-4 uppercase text-[12px] tracking-widest shadow-lg">
               Acceder al Panel Consejos
             </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
