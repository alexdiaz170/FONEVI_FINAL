const { request, pool, makeToken } = require('./helpers');
const { createPeriodo, createSocio } = require('./fixtures');

describe('Auditoría - entradas por CRUD financiero', () => {
  let periodoId, socioId, token;

  beforeAll(async () => {
    periodoId = await createPeriodo(pool, `Periodo Audit ${Date.now()}`);
    socioId = await createSocio(pool, {});
    token = makeToken({ id: 'auditUser', rol: 'administrador', email: 'audit@local' });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM auditoria WHERE usuario_id = $1', ['auditUser']);
    await pool.query('DELETE FROM periodos WHERE id = $1', [periodoId]);
    await pool.query('DELETE FROM socios WHERE id = $1', [socioId]);
    await pool.end();
  });

  test('CREATE aporte genera auditoría', async () => {
    const r = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 50000, estado: 'pendiente' });
    expect(r.status).toBe(201);
    const aporteId = r.body.datos.id;
    const a = await pool.query("SELECT * FROM auditoria WHERE tabla='aportes' AND registro_id=$1 ORDER BY created_at DESC LIMIT 1", [aporteId]);
    expect(a.rows.length).toBeGreaterThan(0);
    const row = a.rows[0];
    expect(row.usuario_id).toBe('auditUser');
    expect(row.accion).toBe('REGISTRAR_APORTE');
  });

  test('UPDATE aporte genera auditoría', async () => {
    const r = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 50000, estado: 'pendiente' });
    const aporteId = r.body.datos.id;
    const upd = await request.put(`/api/aportes/${aporteId}`).set('Authorization', `Bearer ${token}`).send({ estado: 'pagado' });
    expect(upd.status).toBe(200);
    const a = await pool.query("SELECT * FROM auditoria WHERE tabla='aportes' AND registro_id=$1 AND accion='ACTUALIZAR_APORTE' ORDER BY created_at DESC LIMIT 1", [aporteId]);
    expect(a.rows.length).toBeGreaterThan(0);
  });

  test('DELETE aporte genera auditoría', async () => {
    const r = await request.post('/api/aportes').set('Authorization', `Bearer ${token}`).send({ socioId, periodoId, monto: 50000, estado: 'pendiente' });
    const aporteId = r.body.datos.id;
    const del = await request.delete(`/api/aportes/${aporteId}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    const a = await pool.query("SELECT * FROM auditoria WHERE tabla='aportes' AND registro_id=$1 AND accion='ELIMINAR_APORTE' ORDER BY created_at DESC LIMIT 1", [aporteId]);
    expect(a.rows.length).toBeGreaterThan(0);
  });

});
