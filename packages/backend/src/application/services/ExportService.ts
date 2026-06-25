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
}
