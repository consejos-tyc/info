
export enum Priority {
  EmergingGeneration = 'Generación Emergente',
  OrdinancesAndCovenants = 'Ordenanzas y convenios',
  Ministering = 'Ministración',
  Others = 'Otros'
}

export enum ReportCriteria {
  Cumulative = 'Acumulado',
  MonthlyAverage = 'Promedio Mensual'
}

export interface MonthData {
  month: string;
  value: number;
}

export interface IndicatorTemplate {
  id: string;
  priority: Priority;
  name: string;
  criteria: ReportCriteria;
  goal: number;
  description: string;
}

export interface Indicator extends IndicatorTemplate {
  monthlyValues: MonthData[];
}

export enum UserRole {
  StakeLeader = 'StakeLeader',
  AreaSeventy = 'AreaSeventy'
}

export interface User {
  id: string;
  phone: string;
  stakeId: string;
  name: string;
  role: UserRole;
  profileImage?: string;
}

export interface Stake {
  id: string;
  name: string;
  council: 'Tegucigalpa' | 'Comayagüela';
  accessKey: string; // Clave de acceso gratuita
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
