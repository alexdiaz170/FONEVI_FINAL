import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ExportService } from '../../application/services/ExportService.js';
import { logger } from '../logging/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = resolve(__dirname, '..', '..', '..', 'exports');

export interface ReportJobPayload {
  tipo: string;
  formato: 'xlsx' | 'pdf';
  socioId?: string;
  creditoId?: string;
  desde?: string;
  hasta?: string;
}

const exportService = new ExportService();

const handlers: Record<
  string,
  (payload: ReportJobPayload) => Promise<{
    data: Record<string, unknown>[];
    columns: { header: string; key: string; format?: (v: unknown) => string }[];
    title: string;
  }>
> = {
  dashboard: () => exportService.exportDashboard(),
  'balance-general': () => exportService.exportBalanceGeneral(),
  cartera: () => exportService.exportCartera(),
  solidaridad: () => exportService.exportSolidaridad(),
  'acuerdos-pago': () => exportService.exportAcuerdosPago(),
  socios: () => exportService.exportSocios(),
  creditos: () => exportService.exportCreditos(),
  aportes: () => exportService.exportAportes(),
  movimientos: () => exportService.exportMovimientos(),
  'flujo-caja': (p) => exportService.exportFlujoCaja(p.desde, p.hasta),
  'estado-cuenta': (p) => {
    if (!p.socioId) throw new Error('socioId requerido');
    return exportService.exportEstadoCuenta(p.socioId);
  },
  'pagos-credito': (p) => {
    if (!p.creditoId) throw new Error('creditoId requerido');
    return exportService.exportPagosCredito(p.creditoId);
  },
};

export async function generateReportBuffer(
  payload: ReportJobPayload,
): Promise<{ buffer: Buffer; filename: string; mime: string }> {
  const handler = handlers[payload.tipo];
  if (!handler) throw new Error(`Tipo de reporte no encontrado: ${payload.tipo}`);

  const { data, columns, title } = await handler(payload);
  const filename = `${payload.tipo}_${Date.now()}.${payload.formato}`;

  if (payload.formato === 'xlsx') {
    const buffer = await exportService.generateExcel(data, columns, title);
    return {
      buffer,
      filename,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  const buffer = await exportService.generatePDF(data, columns, title);
  return { buffer, filename, mime: 'application/pdf' };
}

export async function saveReportToDisk(
  payload: ReportJobPayload,
): Promise<{ filePath: string; filename: string; mime: string }> {
  await mkdir(EXPORTS_DIR, { recursive: true });
  const { buffer, filename, mime } = await generateReportBuffer(payload);
  const filePath = join(EXPORTS_DIR, filename);
  await writeFile(filePath, buffer);
  logger.info(`Reporte guardado en disco: ${filePath}`);
  return { filePath, filename, mime };
}

export function getExportsDir(): string {
  return EXPORTS_DIR;
}
