
import { Priority, ReportCriteria, IndicatorTemplate, Stake } from './types';

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * CONFIGURACIÓN DE ESTACAS Y DISTRITOS
 * -----------------------------------
 * Para añadir una unidad: 
 * 1. Agregue un objeto con id, name, council y accessKey.
 * 2. La accessKey es la clave que el líder usará para entrar (GRATIS).
 */
export const STAKES: Stake[] = [
  // --- CONSEJO TEGUCIGALPA ---
  { id: 'tegucigalpa', name: 'Estaca Tegucigalpa', council: 'Tegucigalpa', accessKey: 'STK-TEG-77' },
  { id: 'porvenir', name: 'Estaca Porvenir', council: 'Tegucigalpa', accessKey: 'STK-POR-77' },
  { id: 'choluteca', name: 'Estaca Choluteca', council: 'Tegucigalpa', accessKey: 'STK-CHO-77' },
  { id: 'monjaras', name: 'Distrito Monjaras', council: 'Tegucigalpa', accessKey: 'DST-MON-77' },
  { id: 'san-lorenzo', name: 'Distrito San Lorenzo', council: 'Tegucigalpa', accessKey: 'DST-SLO-77' },
  { id: 'la-esperanza', name: 'Estaca La Esperanza', council: 'Tegucigalpa', accessKey: 'STK-ESP-77' },
  { id: 'uyuca', name: 'Estaca Uyuca', council: 'Tegucigalpa', accessKey: 'STK-UYU-77' },
  { id: 'guaymuras', name: 'Estaca Guaymuras', council: 'Tegucigalpa', accessKey: 'STK-GUA-77' },
  { id: 'villa-olimpica', name: 'Estaca Villa Olímpica', council: 'Tegucigalpa', accessKey: 'STK-VOL-77' },
  { id: 'mision-tegucigalpa', name: 'Misión Tegucigalpa', council: 'Tegucigalpa', accessKey: 'MSN-TEG-77' },
  { id: 'danli', name: 'Estaca Danlí', council: 'Tegucigalpa', accessKey: 'STK-DAN-77' },
  
  // --- CONSEJO COMAYAGÜELA ---
  { id: 'comayaguela', name: 'Estaca Comayagüela', council: 'Comayagüela', accessKey: 'STK-COM-77' },
  { id: 'comayagua', name: 'Estaca Comayagua', council: 'Comayagüela', accessKey: 'STK-CMA-77' },
  { id: 'toncontin', name: 'Estaca Toncontin', council: 'Comayagüela', accessKey: 'STK-TON-77' },
  { id: 'country', name: 'Estaca Country', council: 'Comayagüela', accessKey: 'STK-COU-77' },
  { id: 'loarque', name: 'Estaca Loarque', council: 'Comayagüela', accessKey: 'STK-LOA-77' },
  { id: 'bulevard', name: 'Estaca Bulevard', council: 'Comayagüela', accessKey: 'STK-BUL-77' },
  { id: 'torocagua', name: 'Estaca Torocagua', council: 'Comayagüela', accessKey: 'STK-TOR-77' },
  { id: 'mision-comayaguela', name: 'Misión Comayagüela', council: 'Comayagüela', accessKey: 'MSN-COM-77' },
  { id: 'intibuca', name: 'Distrito Intibucá', council: 'Comayagüela', accessKey: 'DST-INT-77' },
  { id: 'juticalpa', name: 'Distrito Juticalpa', council: 'Comayagüela', accessKey: 'DST-JUT-77' },
  { id: 'roble-oeste', name: 'Estaca Roble Oeste', council: 'Comayagüela', accessKey: 'STK-ROE-77' },
];

export const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  { id: 'mision', priority: Priority.EmergingGeneration, name: 'Prepararse y servir una misión', criteria: ReportCriteria.Cumulative, goal: 25, description: 'Número total de jóvenes sirviendo actualmente.' },
  { id: 'bautismos', priority: Priority.OrdinancesAndCovenants, name: 'Convenios bautismales', criteria: ReportCriteria.Cumulative, goal: 150, description: 'Bautismos confirmados en el mes.' },
  { id: 'sacramental', priority: Priority.OrdinancesAndCovenants, name: 'Asistencia a reunión sacramental', criteria: ReportCriteria.MonthlyAverage, goal: 665, description: 'Promedio de asistencia dominical.' },
  { id: 'templo', priority: Priority.OrdinancesAndCovenants, name: 'Obra del templo e historia familiar', criteria: ReportCriteria.Cumulative, goal: 600, description: 'Miembros con recomendaciones vigentes.' },
  { id: 'ministracion', priority: Priority.Ministering, name: 'Entrevistas de ministración', criteria: ReportCriteria.MonthlyAverage, goal: 100, description: 'Porcentaje de entrevistas completadas.' },
  { id: 'diezmo', priority: Priority.Ministering, name: 'Donantes de diezmos', criteria: ReportCriteria.Cumulative, goal: 500, description: 'Número de donantes distintos.' },
  { id: 'ofrendas', priority: Priority.Ministering, name: 'Donantes de ofrendas de ayuno', criteria: ReportCriteria.Cumulative, goal: 500, description: 'Número de donantes de ofrendas.' },
  { id: 'sacerdocio', priority: Priority.Others, name: 'Ordenaciones Sacerdocio Melquicedec', criteria: ReportCriteria.Cumulative, goal: 32, description: 'Hermanos ordenados a Élder o Sumo Sacerdote.' }
];
