const { pool } = require('./helpers');

describe('Integridad referencial', () => {
  test('No existen aportes huérfanos', async () => {
    const res = await pool.query('SELECT a.id FROM aportes a LEFT JOIN socios s ON a.socio_id = s.id LEFT JOIN periodos p ON a.periodo_id = p.id WHERE s.id IS NULL OR p.id IS NULL LIMIT 1');
    expect(res.rows.length).toBe(0);
  });

  test('No existen créditos huérfanos', async () => {
    const res = await pool.query('SELECT id FROM creditos WHERE socio_id IS NULL LIMIT 1');
    expect(res.rows.length).toBe(0);
  });

  test('No existen movimientos solidaridad huérfanos', async () => {
    const res = await pool.query('SELECT id FROM solidaridad_movimientos sm LEFT JOIN socios s ON sm.beneficiario = s.id WHERE sm.beneficiario IS NOT NULL AND s.id IS NULL LIMIT 1');
    expect(res.rows.length).toBe(0);
  });
});
