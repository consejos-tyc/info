
import { Indicator, IndicatorTemplate, MonthData, User, UserRole, Stake } from '../types';
import { INDICATOR_TEMPLATES, MONTHS, STAKES } from '../constants';

// *** URL DE PRODUCCIÓN DE GOOGLE APPS SCRIPT ***
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy7IepGM11gS3doMgDd74MigSP-lbZiwm5OBMXGhXPevTUul_TtEDZ44408Xl9bbxo7Q/exec'; 

const apiCall = async (action: string, payload: any = {}) => {
  try {
    // Google Apps Script requires POST requests to be sent as text/plain to avoid CORS preflight issues in some cases,
    // or standard JSON if the script handles OPTIONS. We uses no-cors strategy or simple POST.
    // The most reliable way for GAS Web App is sending data as text string in body.
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("API Error:", error);
    return { error: 'Error de conexión con la hoja de cálculo.' };
  }
};

export const authService = {
  // Ahora es asíncrono
  getUser: async (phone: string): Promise<User | null> => {
    const res = await apiCall('get_user', { phone });
    if (res.user) {
      // Aseguramos que phone sea string para evitar errores
      res.user.phone = String(res.user.phone || '');
    }
    return res.user || null;
  },
  
  // Para persistencia local de sesión (cache simple)
  getLocalSession: (): User | null => {
    const data = localStorage.getItem('lds_session');
    return data ? JSON.parse(data) : null;
  },

  setLocalSession: (user: User) => {
    localStorage.setItem('lds_session', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('lds_session');
  },

  // Registro en la nube
  register: async (phone: string, stakeId: string, name: string): Promise<{ user?: User, error?: string }> => {
    const res = await apiCall('register_user', { 
      phone, 
      stakeId, 
      name, 
      role: UserRole.StakeLeader 
    });
    if (res.user) {
      res.user.phone = String(res.user.phone || '');
      authService.setLocalSession(res.user);
      return { user: res.user };
    }
    return { error: res.error || 'Error al registrar.' };
  },

  loginSeventy: (phone: string, password: string): { user?: User, error?: string } => {
    // El login de Setenta sigue siendo local/hardcoded por seguridad simple o puedes moverlo al script
    if (phone === '33334444' && password === 'Regiontyc_') {
      const user: User = { 
        id: 'admin-1', 
        phone, 
        stakeId: 'admin', 
        name: 'Setenta de Área', 
        role: UserRole.AreaSeventy 
      };
      authService.setLocalSession(user);
      return { user };
    }
    return { error: 'Credenciales de consejos incorrectas.' };
  },

  verifyStakeKey: (stakeId: string, inputKey: string): boolean => {
    // Check custom keys first
    const customKeys = localStorage.getItem('lds_stake_keys');
    const parsedKeys = customKeys ? JSON.parse(customKeys) : {};
    
    if (parsedKeys[stakeId]) {
         return parsedKeys[stakeId].toUpperCase().trim() === inputKey.toUpperCase().trim();
    }

    const defaultStake = STAKES.find(s => s.id === stakeId);
    return (defaultStake?.accessKey || "").toUpperCase().trim() === inputKey.toUpperCase().trim();
  },

  getCustomStakeKeys: (): Record<string, string> => {
    const keys = localStorage.getItem('lds_stake_keys');
    return keys ? JSON.parse(keys) : {};
  },

  saveStakeKey: (stakeId: string, key: string) => {
    const keys = localStorage.getItem('lds_stake_keys');
    const parsedKeys = keys ? JSON.parse(keys) : {};
    parsedKeys[stakeId] = key;
    localStorage.setItem('lds_stake_keys', JSON.stringify(parsedKeys));
  },

  updateUser: async (updatedUser: User) => {
    // Nota: Para implementar update de imagen en la nube, requeriría más lógica en el script.
    // Por ahora actualizamos sesión local.
    authService.setLocalSession(updatedUser);
  },
  
  // Modificado: Ahora acepta phone y llama a la API real
  deregister: async (phone: string) => {
    try {
      await apiCall('delete_user', { phone });
    } catch (e) {
      console.error("Error eliminando usuario nube", e);
    }
    authService.logout();
  },

  // Nueva función para borrar usuario desde Admin
  deleteUser: async (phone: string) => {
    const res = await apiCall('delete_user', { phone });
    return res;
  }
};

export const dataService = {
  // Obtener datos combinados (Valores + Metas) desde la hoja
  getIndicatorData: async (stakeId: string): Promise<Indicator[]> => {
    const res = await apiCall('get_stake_data', { stakeId });
    
    // Si falla o está vacío, usar estructura base
    const dbValues: {id: string, month: string, value: number}[] = res.values || [];
    const dbGoals: Record<string, number> = res.goals || {};

    const baseData = INDICATOR_TEMPLATES.map(template => {
      // Mapear valores mensuales
      const monthlyValues = MONTHS.map(m => {
        const found = dbValues.find(v => v.id === template.id && v.month === m);
        return { month: m, value: found ? found.value : 0 };
      });

      return {
        ...template,
        monthlyValues,
        goal: dbGoals[template.id] ?? template.goal
      };
    });
    
    return baseData;
  },

  updateMonthlyValue: async (stakeId: string, indicatorId: string, month: string, value: number) => {
    // Fire and forget (o await si la UI lo requiere)
    await apiCall('save_value', { stakeId, indicatorId, month, value });
  },

  saveCustomGoals: async (stakeId: string, goals: Record<string, number>) => {
    await apiCall('save_goals', { stakeId, goals });
  },
  
  // Para el Admin Dashboard: Obtener TODO de una vez para no hacer 20 llamadas
  getAdminConsolidatedData: async () => {
    const res = await apiCall('get_admin_data');
    // Sanitizar tipos de datos que vienen de la hoja de cálculo
    if (res.users && Array.isArray(res.users)) {
        res.users = res.users.map((u: any) => ({
            ...u,
            phone: String(u.phone || '') // Conversión forzosa a string
        }));
    }
    return res; // { users: [], rawData: [], rawGoals: [] }
  }
};
