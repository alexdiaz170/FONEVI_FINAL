export const FINANCIERO_KEYS = [
  'tasa_interes_mensual',
  'tasa_mora_mensual',
  'porcentaje_seguro',
  'valor_solidaridad',
  'valor_minimo_aporte',
  'valor_ahorro_mensual',
  'multiplicador_maximo_credito',
  'reservas',
];

export const GENERAL_KEYS = ['nombre_institucion', 'nit_institucion', 'representante'];

export const KEY_LABELS: Record<
  string,
  { label: string; type: 'percent' | 'currency' | 'number' | 'text'; desc: string }
> = {
  tasa_interes_mensual: {
    label: 'Tasa de Interés Mensual',
    type: 'percent',
    desc: 'Porcentaje aplicado al capital del crédito',
  },
  tasa_mora_mensual: {
    label: 'Tasa de Mora Mensual',
    type: 'percent',
    desc: 'Porcentaje adicional por pago extemporáneo',
  },
  porcentaje_seguro: {
    label: 'Porcentaje de Seguro',
    type: 'percent',
    desc: 'Porcentaje destinado al seguro del crédito',
  },
  valor_solidaridad: {
    label: 'Valor de Solidaridad',
    type: 'currency',
    desc: 'Aporte obligatorio al fondo de solidaridad',
  },
  valor_minimo_aporte: {
    label: 'Valor Mínimo de Aporte',
    type: 'currency',
    desc: 'aporte mensual mínimo requerido',
  },
  valor_ahorro_mensual: {
    label: 'Valor de Ahorro Mensual',
    type: 'currency',
    desc: 'Monto fijo destinado al ahorro en cada aporte',
  },
  multiplicador_maximo_credito: {
    label: 'Multiplicador Máx. Crédito',
    type: 'number',
    desc: 'Veces del ahorro que se puede prestar',
  },
  reservas: {
    label: 'Reservas Institucionales',
    type: 'currency',
    desc: 'Monto de reserva para el balance general',
  },
  nombre_institucion: {
    label: 'Nombre de la Institución',
    type: 'text',
    desc: 'Razón social del fondo',
  },
  nit_institucion: { label: 'NIT', type: 'text', desc: 'Número de identificación tributaria' },
  representante: { label: 'Representante', type: 'text', desc: 'Nombre del representante legal' },
};
