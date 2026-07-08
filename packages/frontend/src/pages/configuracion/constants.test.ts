import { describe, it, expect } from 'vitest';
import { FINANCIERO_KEYS, GENERAL_KEYS, KEY_LABELS } from './constants';

describe('FINANCIERO_KEYS', () => {
  it('has all required financial keys', () => {
    expect(FINANCIERO_KEYS).toContain('tasa_interes_mensual');
    expect(FINANCIERO_KEYS).toContain('tasa_mora_mensual');
    expect(FINANCIERO_KEYS).toContain('porcentaje_seguro');
    expect(FINANCIERO_KEYS).toContain('valor_solidaridad');
    expect(FINANCIERO_KEYS).toContain('valor_minimo_aporte');
    expect(FINANCIERO_KEYS).toContain('multiplicador_maximo_credito');
  });

  it('has exactly 6 keys', () => {
    expect(FINANCIERO_KEYS).toHaveLength(6);
  });
});

describe('GENERAL_KEYS', () => {
  it('has all required general keys', () => {
    expect(GENERAL_KEYS).toContain('nombre_institucion');
    expect(GENERAL_KEYS).toContain('nit_institucion');
    expect(GENERAL_KEYS).toContain('representante');
  });

  it('has exactly 3 keys', () => {
    expect(GENERAL_KEYS).toHaveLength(3);
  });
});

describe('KEY_LABELS', () => {
  it('has an entry for every FINANCIERO_KEYS', () => {
    FINANCIERO_KEYS.forEach((key) => {
      expect(KEY_LABELS).toHaveProperty(key);
    });
  });

  it('has an entry for every GENERAL_KEYS', () => {
    GENERAL_KEYS.forEach((key) => {
      expect(KEY_LABELS).toHaveProperty(key);
    });
  });

  it('each entry has the correct shape', () => {
    const entries = Object.entries(KEY_LABELS);
    entries.forEach(([key, config]) => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('desc');
      expect(['percent', 'currency', 'number', 'text']).toContain(config.type);
    });
  });

  it('has correct types for financial keys', () => {
    expect(KEY_LABELS.tasa_interes_mensual.type).toBe('percent');
    expect(KEY_LABELS.tasa_mora_mensual.type).toBe('percent');
    expect(KEY_LABELS.porcentaje_seguro.type).toBe('percent');
    expect(KEY_LABELS.valor_solidaridad.type).toBe('currency');
    expect(KEY_LABELS.valor_minimo_aporte.type).toBe('currency');
    expect(KEY_LABELS.multiplicador_maximo_credito.type).toBe('number');
  });

  it('has correct types for general keys', () => {
    expect(KEY_LABELS.nombre_institucion.type).toBe('text');
    expect(KEY_LABELS.nit_institucion.type).toBe('text');
    expect(KEY_LABELS.representante.type).toBe('text');
  });

  it('has specific label values', () => {
    expect(KEY_LABELS.tasa_interes_mensual.label).toBe('Tasa de Interés Mensual');
    expect(KEY_LABELS.valor_solidaridad.label).toBe('Valor de Solidaridad');
    expect(KEY_LABELS.nombre_institucion.label).toBe('Nombre de la Institución');
  });

  it('every desc is non-empty', () => {
    const entries = Object.entries(KEY_LABELS);
    entries.forEach(([key, config]) => {
      expect(config.desc, `desc for ${key} should not be empty`).toBeTruthy();
    });
  });
});
