const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const TEST_DB = process.env.TEST_DATABASE_URL;
if (!TEST_DB) {
  test.skip('Skipping concurrent aporte test: TEST_DATABASE_URL not set', () => {});
} else {
  describe('Concurrent aporte application with FOR UPDATE', () => {
    let pool;
    let socioId;
    let creditoId;

    beforeAll(async () => {
      pool = new Pool({ connectionString: TEST_DB });
      socioId = uuidv4();
      creditoId = uuidv4();
      // Insert a socio and a credito with initial saldo 1000
      await pool.query('INSERT INTO socios (id, codigo, nombre, documento, fecha_ingreso, aporte_mensual, ahorro_acumulado, estado, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),100000,0,$5,NOW(),NOW()) ON CONFLICT DO NOTHING', [socioId, 'TST001', 'Test Socio', 'DOC'+socioId, 'activo']);
      await pool.query('INSERT INTO creditos (id, socio_id, monto, tasa_mensual, cuotas, cuotas_pagadas, saldo_capital, fecha_desembolso, estado, created_at, updated_at) VALUES ($1,$2,$3,1,12,0,$4,NOW(),$5,NOW(),NOW()) ON CONFLICT DO NOTHING', [creditoId, socioId, 1000, 1000, 'activo']);
    }, 20000);

    afterAll(async () => {
      try {
        await pool.query('DELETE FROM creditos WHERE id = $1', [creditoId]);
        await pool.query('DELETE FROM socios WHERE id = $1', [socioId]);
      } finally {
        await pool.end();
      }
    });

    test('two concurrent applications do not over-apply (final saldo correct)', async () => {
      const apply = async (amount) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const res = await client.query(`SELECT id, saldo_capital FROM creditos WHERE socio_id = $1 AND estado <> 'pagado' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [socioId]);
          const row = res.rows[0];
          if (!row) {
            await client.query('ROLLBACK');
            return 0;
          }
          const saldo = Number(row.saldo_capital || 0);
          const aplicado = Math.min(saldo, amount);
          const nuevoSaldo = Math.max(0, saldo - aplicado);
          const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'activo';
          await client.query('UPDATE creditos SET saldo_capital = $1, estado = $2 WHERE id = $3', [nuevoSaldo, nuevoEstado, row.id]);
          await client.query('COMMIT');
          return aplicado;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      };

      // Two concurrent requests trying to apply 800 each against saldo 1000
      const [a1, a2] = await Promise.all([apply(800), apply(800)]);
      const totalApplied = (a1 || 0) + (a2 || 0);
      const final = await pool.query('SELECT saldo_capital FROM creditos WHERE id = $1', [creditoId]);
      const finalSaldo = Number(final.rows[0].saldo_capital || 0);

      expect(finalSaldo).toBeGreaterThanOrEqual(0);
      expect(finalSaldo).toBeLessThanOrEqual(1000);
      expect(totalApplied).toBeLessThanOrEqual(1000);
      expect(totalApplied + finalSaldo).toBeCloseTo(1000);
    }, 30000);
  });
}
