import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IAporteRepository } from '../../../domain/repositories/IAporteRepository.js';
import { ConfiguracionService } from '../../services/ConfiguracionService.js';
import { NotFoundError } from '../../errors.js';

export interface MiDashboardSocio {
  id: string;
  codigo: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string | null;
  telefono: string | null;
  ahorroAcumulado: number;
  estado: string;
}

export interface MiDashboardCredito {
  id: string;
  monto: number;
  saldoCapital: number;
  cuotas: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  cuotaMensual: number;
  estado: string;
}

export interface MiDashboardAporte {
  id: string;
  periodoId: number;
  monto: number;
  estado: string;
  createdAt: string;
}

export interface MiDashboardResult {
  socio: MiDashboardSocio;
  creditos: MiDashboardCredito[];
  ultimosAportes: MiDashboardAporte[];
  config: {
    tasaInteresMensual: number;
    multiplicadorMaximoCredito: number;
    porcentajeSeguro: number;
  };
}

export class ObtenerMiDashboardUseCase {
  constructor(
    private readonly socioRepo: ISocioRepository,
    private readonly creditoRepo: ICreditoRepository,
    private readonly aporteRepo: IAporteRepository,
    private readonly configService: ConfiguracionService,
  ) {}

  async execute(email: string): Promise<MiDashboardResult> {
    const socio = await this.socioRepo.findByEmail(email);
    if (!socio) throw new NotFoundError('Socio no encontrado para este usuario');

    const [creditosResult, aportesResult, tasaInteres, multiplicador, seguro] = await Promise.all([
      this.creditoRepo.findAll({ socioId: socio.id, limit: 50 }),
      this.aporteRepo.findAll({ socioId: socio.id, limit: 5 }),
      this.configService.getTasaInteresMensual(),
      this.configService.getMultiplicadorMaximoCredito(),
      this.configService.getTasaSeguro(),
    ]);

    return {
      socio: {
        id: socio.id,
        codigo: socio.codigo,
        nombre: socio.nombre,
        tipoDocumento: socio.tipoDocumento.toString(),
        numeroDocumento: socio.numeroDocumento,
        email: socio.email?.value ?? null,
        telefono: socio.telefono?.toString() ?? null,
        ahorroAcumulado: socio.ahorroAcumulado.value,
        estado: socio.estado.toString(),
      },
      creditos: creditosResult.data.map((c) => ({
        id: c.id,
        monto: c.monto.value,
        saldoCapital: c.saldoCapital?.value ?? c.monto.value,
        cuotas: c.cuotas,
        cuotasPagadas: c.cuotasPagadas,
        cuotasRestantes: c.cuotas - c.cuotasPagadas,
        cuotaMensual: c.cuotaMensual?.value ?? 0,
        estado: c.estado.toString(),
      })),
      ultimosAportes: aportesResult.data.map((a) => ({
        id: a.id,
        periodoId: a.periodoId,
        monto: a.monto.value,
        estado: a.estado.toString(),
        createdAt: a.createdAt.toISOString(),
      })),
      config: {
        tasaInteresMensual: tasaInteres,
        multiplicadorMaximoCredito: multiplicador,
        porcentajeSeguro: seguro,
      },
    };
  }
}
