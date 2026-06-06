const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio, createCredito } = require('./fixtures');

describe('Aportes API - regresión financiera', () => {
  let periodoId, socioId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Aportes ${Date.now()}`);
    socioId = await createSocio(pool, { aporte_mensual: 120000 });
    token = makeToken({ id: 'd02bfc7b-8183-4d45-b034-f5c0a74b6964', rol: 'administrador', email: 'test@local' });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM aportes WHERE periodo_id = $1', [periodoId]);
    await pool.query('DELETE FROM periodos WHERE id = $1', [periodoId]);
    await pool.query('DELETE FROM socios WHERE id = $1', [socioId]);
    await pool.end();
  });

  test('Crear aporte correctamente y actualizar ahorro_acumulado cuando estado=pagado', async () => {
    // initial ahorro
    const before = await pool.query('SELECT ahorro_acumulado FROM socios WHERE id = $1', [socioId]);
    const initialAhorro = Number(before.rows[0].ahorro_acumulado || 0);

    const res = await request.post('/api/aportes')
      .set('Authorization', `Bearer ${token}`)
      .send({ socioId, periodoId, monto: 100000, estado: 'pagado' });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    const aporteId = res.body.datos.id;

    const after = await pool.query('SELECT ahorro_acumulado FROM socios WHERE id = $1', [socioId]);
    const finalAhorro = Number(after.rows[0].ahorro_acumulado || 0);
    expect(finalAhorro).toBe(initialAhorro + 100000);

    // Clean
    await request.delete(`/api/aportes/${aporteId}`).set('Authorization', `Bearer ${token}`);
  });

  test('Crear aporte con pago a crédito aplica al saldo_capital', async () => {
    const creditoId = await createCredito(pool, socioId, 500);

    const res = await request.post('/api/aportes')
      .set('Authorization', `Bearer ${token}`)
      .send({ socioId, periodoId, monto: 100000, pago_credito: 200, estado: 'pendiente' });

    expect(res.status).toBe(201);
    const dbCred = await pool.query('SELECT saldo_capital FROM creditos WHERE id = $1', [creditoId]);
    expect(Number(dbCred.rows[0].saldo_capital)).toBe(300);

    // cleanup
    await pool.query('DELETE FROM creditos WHERE id = $1', [creditoId]);
  });

  test('Crear aporte con pago_solidaridad crea movimiento', async () => {
    const res = await request.post('/api/aportes')
      .set('Authorization', `Bearer ${token}`)
      .send({ socioId, periodoId, monto: 100000, pago_solidaridad: 5000, estado: 'pendiente' });
    expect(res.status).toBe(201);
    const movs = await pool.query('SELECT * FROM solidaridad_movimientos WHERE descripcion LIKE $1 ORDER BY created_at DESC LIMIT 1', ['Aporte solidaridad — %']);
    expect(movs.rows.length).toBeGreaterThan(0);
  });

});
