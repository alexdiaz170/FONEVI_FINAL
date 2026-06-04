const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio, createCredito } = require('./fixtures');

describe('Concurrencia - aportes simultáneos', () => {
  let socioId, periodoId, creditoId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Concurrency ${Date.now()}`);
    socioId = await createSocio(pool, {});
    creditoId = await createCredito(pool, socioId, 10000);
    token = makeToken({ id: 'testuser', rol: 'administrador', email: 'test@local' });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM creditos WHERE id = $1', [creditoId]);
    await pool.query('DELETE FROM periodos WHERE id = $1', [periodoId]);
    await pool.query('DELETE FROM socios WHERE id = $1', [socioId]);
    await pool.end();
  });

  test('10 aportes concurrentes no sobre-aplican y saldo final correcto', async () => {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 100000, pago_credito: 1500, estado: 'pendiente' }));
    }
    const results = await Promise.all(tasks);
    results.forEach(r => expect([201,200].includes(r.status)).toBeTruthy());

    const final = await pool.query('SELECT saldo_capital FROM creditos WHERE id = $1', [creditoId]);
    const finalSaldo = Number(final.rows[0].saldo_capital || 0);
    // initial 10000, total attempted 1500*10=15000 but cannot go below 0
    expect(finalSaldo).toBeGreaterThanOrEqual(0);
    expect(finalSaldo).toBeLessThanOrEqual(10000);

    const appliedSumRes = await pool.query('SELECT SUM(pago_credito) as total FROM aportes WHERE socio_id = $1', [socioId]);
    const totalApplied = Number(appliedSumRes.rows[0].total || 0);
    expect(totalApplied + finalSaldo).toBeCloseTo(10000);
  }, 60000);

});
