import { Router, Request, Response, NextFunction } from 'express';
import { ExportService } from '../../application/services/ExportService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { apiResponse } from '../response.js';

const router = Router();
const exportService = new ExportService();

const exporters: Record<
  string,
  () => Promise<{
    data: Record<string, unknown>[];
    columns: { header: string; key: string; format?: (v: unknown) => string }[];
    title: string;
  }>
> = {
  dashboard: () => exportService.exportDashboard(),
  'balance-general': () => exportService.exportBalanceGeneral(),
  cartera: () => exportService.exportCartera(),
};

router.get(
  '/:tipo/:formato',
  authenticate,
  authorize('admin', 'superadmin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tipo = String(req.params.tipo);
      const formato = String(req.params.formato);
      const exportFn = exporters[tipo];
      if (!exportFn) {
        apiResponse.error(res, 404, `Tipo de reporte no encontrado: ${tipo}`);
        return;
      }

      if (formato !== 'xlsx' && formato !== 'pdf') {
        apiResponse.error(res, 400, 'Formato debe ser xlsx o pdf');
        return;
      }

      const { data, columns, title } = (await exportFn()) as Awaited<
        ReturnType<typeof exportService.exportDashboard>
      >;

      if (formato === 'xlsx') {
        const buffer = await exportService.generateExcel(data, columns, title);
        res.set(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.set('Content-Disposition', `attachment; filename="${tipo}.xlsx"`);
        res.send(buffer);
      } else {
        const buffer = await exportService.generatePDF(data, columns, title);
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename="${tipo}.pdf"`);
        res.send(buffer);
      }
    } catch (error) {
      next(error);
    }
  },
);

export default router;
