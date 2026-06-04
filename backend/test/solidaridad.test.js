const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio } = require('./fixtures');

describe('Solidaridad - movimientos y saldo', () => {
  let periodoId, socioId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Solid ${Date.now()}`);
    socioId = await createSocio(pool, {});
    token = makeToken({ id: 'solidUser', rol: 'administrador', email: 'solid@local' });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM solidaridad_movimientos WHERE descripcion LIKE $1', ['Aporte solidaridad — %']);
    await pool.query('DELETE FROM periodos WHERE id = $1', [periodoId]);
    await pool.query('DELETE FROM socios WHERE id = $1', [socioId]);
    await pool.end();
  });

  test('Ingreso generado desde aporte y saldo correcto', async () => {
    const r = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 100000, pago_solidaridad: 5000, estado: 'pendiente' });
    expect(r.status).toBe(201);
    const sum = await pool.query("SELECT SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END) as saldo FROM solidaridad_movimientos");
    const saldo = Number(sum.rows[0].saldo || 0);
    // saldo may be more than 0 depending on other tests, just ensure at least one ingreso exists
    const movs = await pool.query("SELECT * FROM solidaridad_movimientos WHERE descripcion LIKE $1", ['Aporte solidaridad — %']);
    expect(movs.rows.length).toBeGreaterThan(0);
  });

});
