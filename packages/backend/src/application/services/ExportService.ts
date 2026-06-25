import ExcelJS from 'xlsx';
import PDFDocument from 'pdfkit';
import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

type Column = { header: string; key: string; format?: (v: unknown) => string };

export class ExportService {
  async generateExcel(
    rows: Record<string, unknown>[],
    columns: Column[],
    title: string,
  ): Promise<Buffer> {
    const data = rows.map((r) => {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        row[col.header] = col.format ? col.format(r[col.key]) : (r[col.key] ?? '');
      }
      return row;
    });

    const ws = ExcelJS.utils.json_to_sheet(data);
    ws['!cols'] = columns.map((c) => ({ wch: Math.max(c.header.length, 14) }));
    const wb = ExcelJS.utils.book_new();
    ExcelJS.utils.book_append_sheet(wb, ws, title);
    return Buffer.from(ExcelJS.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generatePDF(
    rows: Record<string, unknown>[],
    columns: Column[],
    title: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'LETTER', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).font('Helvetica-Bold').text('FONEVI', { continued: true });
      doc.fontSize(10).font('Helvetica').text(`  |  ${title}`, { align: 'left' });
      doc.moveDown(0.5);
      doc
        .fontSize(8)
        .fillColor('#666')
        .text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, { align: 'right' });
      doc.moveDown(0.5);

      const headers = columns.map((c) => c.header);
      const body = rows.map((r) =>
        columns.map((c) => (c.format ? c.format(r[c.key]) : (r[c.key] ?? ''))),
      );

      const colW = Math.floor((doc.page.width - 60) / columns.length);
      doc.fontSize(8).font('Helvetica-Bold');
      doc.rect(30, doc.y, doc.page.width - 60, 14).fill('#342866');
      doc.fill('#fff');
      headers.forEach((h, i) =>
        doc.text(h, 32 + i * colW, doc.y - 12, { width: colW - 4, align: 'left' }),
      );
      doc.fill('#000');
      doc.moveDown(0.1);
      doc.font('Helvetica').fontSize(7);
      for (const row of body) {
        const y = doc.y;
        doc
          .rect(30, y - 2, doc.page.width - 60, 12)
          .fill('#f5f5f5')
          .fill('#000');
        row.forEach((v, i) =>
          doc.text(String(v), 32 + i * colW, y - 1, { width: colW - 4, align: 'left' }),
        );
        doc.moveDown(0.3);
        if (doc.y > doc.page.height - 40) doc.addPage();
      }

      doc.end();
    });
  }

  async exportDashboard(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const [socios, creditos, aportes] = await Promise.all([
      prisma.socio.findMany({
        where: { deletedAt: null },
        select: { estado: true, ahorroAcumulado: true },
      }),
      prisma.credito.findMany({
        where: { deletedAt: null },
        select: { estado: true, saldoCapital: true, monto: true },
      }),
      prisma.aporte.findMany({ select: { monto: true, estado: true, pagoSolidaridad: true } }),
    ]);

    const totalSocios = socios.length;
    const activos = socios.filter((s) => s.estado === 'activo').length;
    const enMora = socios.filter((s) => s.estado === 'mora').length;
    const totalAhorros = socios.reduce((s, x) => s + Number(x.ahorroAcumulado), 0);
    const creditosActivos = creditos.filter((c) => c.estado === 'activo').length;
    const montoPrestado = creditos.reduce((s, x) => s + Number(x.monto), 0);
    const saldoPorCobrar = creditos
      .filter((c) => c.estado === 'activo')
      .reduce((s, x) => s + Number(x.saldoCapital), 0);
    const creditosPagados = creditos.filter((c) => c.estado === 'pagado').length;
    const totalAportes = aportes
      .filter((a) => a.estado === 'pagado')
      .reduce((s, x) => s + Number(x.monto), 0);
    const totalSolidaridad = aportes.reduce((s, x) => s + Number(x.pagoSolidaridad), 0);

    return {
      title: 'Dashboard - Resumen General',
      columns: [
        { header: 'Indicador', key: 'indicador' },
        { header: 'Valor', key: 'valor', format: (v) => Number(v).toLocaleString('es-CO') },
      ],
      data: [
        { indicador: 'Socios activos', valor: activos },
        { indicador: 'Socios en mora', valor: enMora },
        { indicador: 'Total socios', valor: totalSocios },
        { indicador: 'Ahorro acumulado', valor: totalAhorros },
        { indicador: 'Créditos activos', valor: creditosActivos },
        { indicador: 'Créditos pagados', valor: creditosPagados },
        { indicador: 'Monto prestado total', valor: montoPrestado },
        { indicador: 'Saldo por cobrar', valor: saldoPorCobrar },
        { indicador: 'Total aportes recibidos', valor: totalAportes },
        { indicador: 'Fondo solidaridad', valor: totalSolidaridad },
      ],
    };
  }

  async exportBalanceGeneral(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const [socios, creditos, aportes, movimientos] = await Promise.all([
      prisma.socio.findMany({
        where: { deletedAt: null },
        select: { ahorroAcumulado: true, estado: true },
      }),
      prisma.credito.findMany({
        where: { deletedAt: null },
        select: { saldoCapital: true, monto: true, estado: true },
      }),
      prisma.aporte.findMany({ select: { monto: true, estado: true } }),
      prisma.movimiento.findMany({ select: { monto: true, tipo: true } }),
    ]);

    const totalAhorros = socios.reduce((s, x) => s + Number(x.ahorroAcumulado), 0);
    const carteraBruta = creditos
      .filter((c) => c.estado !== 'cancelado')
      .reduce((s, x) => s + Number(x.saldoCapital), 0);
    const ingresos = movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((s, x) => s + Number(x.monto), 0);
    const egresos = movimientos
      .filter((m) => m.tipo === 'egreso')
      .reduce((s, x) => s + Number(x.monto), 0);
    const totalAportes = aportes
      .filter((a) => a.estado === 'pagado')
      .reduce((s, x) => s + Number(x.monto), 0);

    return {
      title: 'Balance General',
      columns: [
        { header: 'Cuenta', key: 'cuenta' },
        { header: 'Valor', key: 'valor', format: (v) => Number(v).toLocaleString('es-CO') },
      ],
      data: [
        { cuenta: 'Ahorro acumulado socios', valor: totalAhorros },
        { cuenta: 'Cartera bruta (saldo capital)', valor: carteraBruta },
        { cuenta: 'Total ingresos acumulados', valor: ingresos },
        { cuenta: 'Total egresos acumulados', valor: egresos },
        { cuenta: 'Total aportes recibidos', valor: totalAportes },
        { cuenta: 'Patrimonio neto', valor: ingresos - egresos },
      ],
    };
  }

  async exportSolidaridad(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const items = await prisma.solidaridadMovimiento.findMany({
      orderBy: { fecha: 'desc' },
    });

    return {
      title: 'Fondo de Solidaridad',
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Beneficiario', key: 'beneficiario' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
      ],
      data: items.map((m) => ({
        fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO') : '',
        tipo: m.tipo,
        descripcion: m.descripcion ?? '',
        beneficiario: m.beneficiario ?? '',
        monto: Number(m.monto),
      })),
    };
  }

  async exportAcuerdosPago(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const acuerdos = await prisma.acuerdoPago.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: 'Acuerdos de Pago',
      columns: [
        { header: 'Socio ID', key: 'socioId' },
        {
          header: 'Monto Total',
          key: 'montoTotal',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        {
          header: 'Cuota',
          key: 'montoCuota',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        { header: 'Cuotas', key: 'cuotas' },
        { header: 'Estado', key: 'estado' },
        { header: 'Inicio', key: 'fechaInicio' },
      ],
      data: acuerdos.map((a) => ({
        socioId: a.socioId,
        montoTotal: Number(a.montoTotal),
        montoCuota: Number(a.montoCuota),
        cuotas: a.cuotas,
        estado: a.estado,
        fechaInicio: a.fechaInicio ? new Date(a.fechaInicio).toLocaleDateString('es-CO') : '',
      })),
    };
  }

  async exportSocios(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const socios = await prisma.socio.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
    });

    return {
      title: 'Listado de Socios',
      columns: [
        { header: 'Código', key: 'codigoSocio' },
        { header: 'Nombre', key: 'nombre' },
        { header: 'Documento', key: 'numeroDocumento' },
        { header: 'Email', key: 'email' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Estado', key: 'estado' },
        {
          header: 'Ahorro',
          key: 'ahorroAcumulado',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        { header: 'Cargo', key: 'cargo' },
        { header: 'Sede', key: 'sede' },
        { header: 'Ingreso', key: 'fechaIngreso' },
      ],
      data: socios.map((s) => ({
        codigoSocio: s.codigo ?? '',
        nombre: s.nombre,
        numeroDocumento: s.documento ?? '',
        email: s.email ?? '',
        telefono: s.telefono ?? '',
        estado: s.estado,
        ahorroAcumulado: Number(s.ahorroAcumulado),
        cargo: s.cargo ?? '',
        sede: s.sede ?? '',
        fechaIngreso: s.fechaIngreso ? new Date(s.fechaIngreso).toLocaleDateString('es-CO') : '—',
      })),
    };
  }

  async exportCreditos(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const creditos = await prisma.credito.findMany({
      where: { deletedAt: null },
      include: { socio: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: 'Listado de Créditos',
      columns: [
        { header: 'Socio', key: 'nombreSocio' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
        { header: 'Tasa %', key: 'tasaMensual', format: (v) => `${Number(v)}%` },
        { header: 'Cuotas', key: 'cuotas' },
        { header: 'Pagadas', key: 'cuotasPagadas' },
        {
          header: 'Saldo',
          key: 'saldoCapital',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        { header: 'Estado', key: 'estado' },
        { header: 'Desembolso', key: 'fechaDesembolso' },
        { header: 'Propósito', key: 'proposito' },
      ],
      data: creditos.map((c) => ({
        nombreSocio: c.socio?.nombre ?? 'N/A',
        monto: Number(c.monto),
        tasaMensual: Number(c.tasaMensual ?? 0),
        cuotas: String(c.cuotas),
        cuotasPagadas: String(c.cuotasPagadas ?? 0),
        saldoCapital: Number(c.saldoCapital ?? 0),
        estado: c.estado,
        fechaDesembolso: c.fechaDesembolso
          ? new Date(c.fechaDesembolso).toLocaleDateString('es-CO')
          : '—',
        proposito: c.proposito ?? '',
      })),
    };
  }

  async exportAportes(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const aportes = await prisma.aporte.findMany({
      include: { socio: { select: { id: true } }, periodo: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: 'Listado de Aportes',
      columns: [
        { header: 'Socio ID', key: 'socioId' },
        { header: 'Periodo', key: 'periodoNombre' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
        { header: 'Fecha', key: 'fechaPago' },
        { header: 'Estado', key: 'estado' },
        { header: 'Método', key: 'metodo' },
        { header: 'Notas', key: 'notas' },
        {
          header: 'Solidaridad',
          key: 'pagoSolidaridad',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        {
          header: 'Abono Crédito',
          key: 'pagoCredito',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
      ],
      data: aportes.map((a) => ({
        socioId: a.socioId,
        periodoNombre: a.periodo?.nombre ?? String(a.periodoId),
        monto: Number(a.monto),
        fechaPago: a.fechaPago ? new Date(a.fechaPago).toLocaleDateString('es-CO') : '—',
        estado: a.estado,
        metodo: a.metodo ?? '',
        notas: a.notas ?? '',
        pagoSolidaridad: Number(a.pagoSolidaridad ?? 0),
        pagoCredito: Number(a.pagoCredito ?? 0),
      })),
    };
  }

  async exportMovimientos(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const movimientos = await prisma.movimiento.findMany({
      orderBy: { fecha: 'desc' },
    });

    return {
      title: 'Listado de Movimientos',
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Socio', key: 'socioNombre' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
      ],
      data: movimientos.map((m) => ({
        fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO') : '—',
        tipo: m.tipo,
        categoria: m.categoria ?? '',
        socioNombre: m.socioId ?? '',
        descripcion: m.descripcion ?? '',
        monto: Number(m.monto),
      })),
    };
  }

  async exportFlujoCaja(
    desde?: string,
    hasta?: string,
  ): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const where: Record<string, unknown> = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) (where.fecha as Record<string, unknown>).gte = new Date(desde);
      if (hasta) (where.fecha as Record<string, unknown>).lte = new Date(hasta);
    }
    const movimientos = await prisma.movimiento.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    return {
      title: 'Flujo de Caja',
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
      ],
      data: movimientos.map((m) => ({
        fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO') : '',
        tipo: m.tipo,
        categoria: m.categoria ?? '',
        descripcion: m.descripcion ?? '',
        monto: Number(m.monto),
      })),
    };
  }

  async exportEstadoCuenta(socioId: string): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const [socio, aportes, creditos] = await Promise.all([
      prisma.socio.findUnique({ where: { id: socioId } }),
      prisma.aporte.findMany({
        where: { socioId },
        include: { periodo: { select: { nombre: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.credito.findMany({
        where: { socioId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const rows: Record<string, unknown>[] = [];
    rows.push({ indicador: '--- APORTES ---', valor: '' });
    for (const a of aportes) {
      rows.push({
        indicador: a.periodo?.nombre ?? String(a.periodoId),
        valor: `$${Number(a.monto).toLocaleString('es-CO')}`,
      });
    }
    rows.push({ indicador: '--- CRÉDITOS ---', valor: '' });
    for (const c of creditos) {
      rows.push({
        indicador: `$${Number(c.monto).toLocaleString('es-CO')} (saldo: $${Number(c.saldoCapital ?? 0).toLocaleString('es-CO')})`,
        valor: `${c.cuotas} cuotas, ${c.cuotasPagadas} pagadas - ${c.estado}`,
      });
    }

    return {
      title: `Estado de Cuenta - ${socio?.nombre ?? socioId}`,
      columns: [
        { header: 'Concepto', key: 'indicador' },
        { header: 'Detalle', key: 'valor' },
      ],
      data: rows,
    };
  }

  async exportCartera(): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const creditos = await prisma.credito.findMany({
      where: { deletedAt: null },
      include: { socio: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: 'Cartera de Créditos',
      columns: [
        { header: 'Socio', key: 'socio' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
        { header: 'Saldo', key: 'saldo', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
        { header: 'Cuotas', key: 'cuotas' },
        { header: 'Pagadas', key: 'pagadas' },
        { header: 'Estado', key: 'estado' },
      ],
      data: creditos.map((c) => ({
        socio: c.socio?.nombre ?? 'N/A',
        monto: Number(c.monto),
        saldo: Number(c.saldoCapital),
        cuotas: c.cuotas,
        pagadas: c.cuotasPagadas,
        estado: c.estado,
      })),
    };
  }

  async exportPagosCredito(creditoId: string): Promise<{
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
  }> {
    const prisma = getPrismaClient();
    const pagos = await prisma.pagoCuota.findMany({
      where: { creditoId },
      orderBy: { fechaPago: 'desc' },
    });

    return {
      title: `Pagos - Crédito #${creditoId}`,
      columns: [
        { header: 'Fecha', key: 'fecha' },
        { header: 'N° Cuota', key: 'numeroCuota' },
        { header: 'Monto', key: 'monto', format: (v) => `$${Number(v).toLocaleString('es-CO')}` },
        {
          header: 'Capital',
          key: 'montoCapital',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        {
          header: 'Interés',
          key: 'montoInteres',
          format: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
      ],
      data: pagos.map((p) => ({
        fecha: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-CO') : '',
        numeroCuota: p.numeroCuota,
        monto: Number(p.monto),
        montoCapital: Number(p.montoCapital),
        montoInteres: Number(p.montoInteres),
      })),
    };
  }
}
