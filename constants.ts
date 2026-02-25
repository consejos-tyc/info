
import { Priority, ReportCriteria, IndicatorTemplate, Stake, CalculationType } from './types';

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ... (STAKES array remains unchanged, so I will skip it in the replacement if I can target specifically INDICATOR_TEMPLATES, but edit_file needs contiguous block. I'll include STAKES if necessary or just target INDICATOR_TEMPLATES if it's unique enough. It is at the end.)

/**
 * CONFIGURACIÓN DE ESTACAS Y DISTRITOS
 * -----------------------------------
 * Para añadir una unidad: 
 * 1. Agregue un objeto con id, name, council y accessKey.
 * 2. La accessKey es la clave que el líder usará para entrar (GRATIS).
 */
export const STAKES: Stake[] = [
  // --- CONSEJO TEGUCIGALPA ---
  { id: 'tegucigalpa', name: 'Estaca Tegucigalpa', council: 'Tegucigalpa', accessKey: '511056' },
  { id: 'porvenir', name: 'Estaca Porvenir', council: 'Tegucigalpa', accessKey: '1982702' },
  { id: 'choluteca', name: 'Estaca Choluteca', council: 'Tegucigalpa', accessKey: '523585' },
  { id: 'monjaras', name: 'Distrito Monjaras', council: 'Tegucigalpa', accessKey: '1253778' },
  { id: 'san-lorenzo', name: 'Distrito San Lorenzo', council: 'Tegucigalpa', accessKey: '615668' },
  { id: 'la-esperanza', name: 'Estaca La Esperanza', council: 'Tegucigalpa', accessKey: '524077' },
  { id: 'uyuca', name: 'Estaca Uyuca', council: 'Tegucigalpa', accessKey: '525243' },
  { id: 'guaymuras', name: 'Estaca Guaymuras', council: 'Tegucigalpa', accessKey: '519510' },
  { id: 'villa-olimpica', name: 'Estaca Villa Olímpica', council: 'Tegucigalpa', accessKey: '2098946' },
  { id: 'mision-tegucigalpa', name: 'Misión Tegucigalpa', council: 'Tegucigalpa', accessKey: 'MSN-TEG-77' },
  { id: 'danli', name: 'Estaca Danlí', council: 'Tegucigalpa', accessKey: '523283' },
  
  // --- CONSEJO COMAYAGÜELA ---
  { id: 'comayaguela', name: 'Estaca Comayagüela', council: 'Comayagüela', accessKey: '515930' },
  { id: 'comayagua', name: 'Estaca Comayagua', council: 'Comayagüela', accessKey: '524395' },
  { id: 'toncontin', name: 'Estaca Toncontin', council: 'Comayagüela', accessKey: '520225' },
  { id: 'country', name: 'Estaca Country', council: 'Comayagüela', accessKey: '524158' },
  { id: 'loarque', name: 'Estaca Loarque', council: 'Comayagüela', accessKey: '1544977' },
  { id: 'bulevard', name: 'Estaca Bulevard', council: 'Comayagüela', accessKey: '2066971' },
  { id: 'torocagua', name: 'Estaca Torocagua', council: 'Comayagüela', accessKey: '522902' },
  { id: 'mision-comayaguela', name: 'Misión Comayagüela', council: 'Comayagüela', accessKey: 'MSN-COM-77' },
  { id: 'intibuca', name: 'Distrito Intibucá', council: 'Comayagüela', accessKey: '2259834' },
  { id: 'juticalpa', name: 'Distrito Juticalpa', council: 'Comayagüela', accessKey: '616710' },
  { id: 'roble-oeste', name: 'Estaca Roble Oeste', council: 'Comayagüela', accessKey: '2088061' },
];

export const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  { 
    id: 'mision', 
    priority: Priority.EmergingGeneration, 
    name: 'Prepararse y servir una misión', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Cumulative,
    goal: 25, 
    description: 'Número total de jóvenes sirviendo actualmente.',
    helpText: 'Acumulable: Reporte la cantidad total de misioneros que tiene en el campo al cierre del mes. Si tenía 10 y salió 1, reporte 11. Si regresó 1, reste.' 
  },
  { 
    id: 'bautismos', 
    priority: Priority.OrdinancesAndCovenants, 
    name: 'Convenios bautismales', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Sum,
    goal: 150, 
    description: 'Bautismos confirmados en el mes.',
    helpText: 'Sumable: Reporte únicamente los bautismos realizados durante este mes. Estos se sumarán al total anual.'
  },
  { 
    id: 'sacramental', 
    priority: Priority.OrdinancesAndCovenants, 
    name: 'Asistencia a reunión sacramental', 
    criteria: ReportCriteria.MonthlyAverage, 
    calculationType: CalculationType.Average,
    goal: 665, 
    description: 'Promedio de asistencia dominical.',
    helpText: 'Promedio: Reporte el promedio de asistencia de los domingos del mes.'
  },
  { 
    id: 'templo', 
    priority: Priority.OrdinancesAndCovenants, 
    name: 'Obra del templo e historia familiar', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Cumulative,
    goal: 600, 
    description: 'Miembros con recomendaciones vigentes.',
    helpText: 'Acumulable: Reporte el total de miembros con recomendación vigente al cierre del mes.'
  },
  { 
    id: 'ministracion', 
    priority: Priority.Ministering, 
    name: 'Entrevistas de ministración', 
    criteria: ReportCriteria.MonthlyAverage, 
    calculationType: CalculationType.Cumulative,
    goal: 100, 
    description: 'Porcentaje de entrevistas completadas.',
    helpText: 'Acumulable: Reporte el total acumulado de entrevistas realizadas.'
  },
  { 
    id: 'diezmo', 
    priority: Priority.Ministering, 
    name: 'Donantes de diezmos', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Cumulative,
    goal: 500, 
    description: 'Número de donantes distintos.',
    helpText: 'Acumulable: Reporte el número total de donantes acumulados hasta la fecha.'
  },
  { 
    id: 'ofrendas', 
    priority: Priority.Ministering, 
    name: 'Donantes de ofrendas de ayuno', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Cumulative,
    goal: 500, 
    description: 'Número de donantes de ofrendas.',
    helpText: 'Acumulable: Reporte el número total de donantes acumulados hasta la fecha.'
  },
  { 
    id: 'sacerdocio', 
    priority: Priority.Others, 
    name: 'Ordenaciones Sacerdocio Melquicedec', 
    criteria: ReportCriteria.Cumulative, 
    calculationType: CalculationType.Sum,
    goal: 32, 
    description: 'Hermanos ordenados a Élder o Sumo Sacerdote.',
    helpText: 'Sumable: Reporte únicamente las ordenaciones realizadas durante este mes. Se sumarán al anual.'
  }
];
