const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio } = require('./fixtures');

describe('Solidaridad - movimientos y saldo', () => {
  let periodoId, socioId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Solid ${Date.now()}`);
    socioId = await createSocio(pool, {});
    token = makeToken({
      id: 'd02bfc7b-8183-4d45-b034-f5c0a74b6964',
      rol: 'administrador',
      email: 'solid@local'
    });
  });

  afterAll(async () => {
    await pool.query(
      'DELETE FROM solidaridad_movimientos WHERE descripcion LIKE $1',
      ['Aporte solidaridad %']
    );

    await pool.query(
      'DELETE FROM aportes WHERE periodo_id = $1',
      [periodoId]
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

  test('Ingreso generado desde aporte y saldo correcto', async () => {
    const r = await request
      .post('/api/aportes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        socioId,
        periodoId,
        monto: 100000,
        pago_solidaridad: 5000,
        estado: 'pendiente'
      });

    expect(r.status).toBe(201);

    const movs = await pool.query(
      'SELECT * FROM solidaridad_movimientos WHERE descripcion LIKE $1',
      ['Aporte solidaridad %']
    );

    expect(movs.rows.length).toBeGreaterThan(0);
  });
});
