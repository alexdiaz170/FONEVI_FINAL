const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio, createCredito } = require('./fixtures');

describe('Creditos - regresión financiera', () => {
  let socioId, periodoId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Creditos ${Date.now()}`);
    socioId = await createSocio(pool, {});
    token = makeToken({ id: 'd02bfc7b-8183-4d45-b034-f5c0a74b6964', rol: 'administrador', email: 'test@local' });
  });

 afterAll(async () => {
  await pool.query(
    'DELETE FROM aportes WHERE periodo_id = $1',
    [periodoId]
  );

  await pool.query(
    'DELETE FROM creditos WHERE socio_id = $1',
    [socioId]
  );

  await pool.query(
    'DELETE FROM periodos WHERE id = $1',
    [periodoId]
  );

  await pool.query(
    'DELETE FROM socios WHERE id = $1',
    [socioId]
  );

  await pool.end();
});

  test('Crear crédito y aplicar abonos hasta pagado', async () => {
    const creditoId = await createCredito(pool, socioId, 1000);
    // Apply 400
    const r1 = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 100000, pago_credito: 400, estado: 'pendiente' });
    expect(r1.status).toBe(201);
    const after1 = await pool.query('SELECT saldo_capital, estado FROM creditos WHERE id = $1', [creditoId]);
    expect(Number(after1.rows[0].saldo_capital)).toBe(600);

    // Apply 600
    const r2 = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 100000, pago_credito: 600, estado: 'pendiente' });
    expect(r2.status).toBe(201);
    const after2 = await pool.query('SELECT saldo_capital, estado FROM creditos WHERE id = $1', [creditoId]);
    expect(Number(after2.rows[0].saldo_capital)).toBe(0);
    expect(after2.rows[0].estado).toBe('pagado');

    // Ensure not negative
    expect(Number(after2.rows[0].saldo_capital)).toBeGreaterThanOrEqual(0);

    await pool.query('DELETE FROM creditos WHERE id = $1', [creditoId]);
  });

});
