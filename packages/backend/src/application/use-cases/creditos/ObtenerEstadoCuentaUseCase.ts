import { Monto } from '@fonevi/shared';
import { CalculadorCuota } from '../../../domain/services/CalculadorCuota.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../../domain/repositories/IPagoCuotaRepository.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';
import { ConfiguracionService } from '../../services/ConfiguracionService.js';

export interface CuotaAmortizacionDTO {
  numeroCuota: number;
  monto: number;
  montoCapital: number;
  montoInteres: number;
  seguro: number;
  saldoRestante: number;
}

export interface EstadoCuentaResult {
  credito: {
    id: string;
    socioId: string;
    nombreSocio: string;
    monto: number;
    tasaMensual: number;
    cuotas: number;
    cuotasPagadas: number;
    cuotasRestantes: number;
    saldoCapital: number;
    cuotaMensual: number;
    estado: string;
    fechaDesembolso: Date;
    proposito: string | null;
  };
  pagos: Array<{
    id: string;
    numeroCuota: number;
    monto: number;
    montoCapital: number;
    montoInteres: number;
    fechaPago: Date;
  }>;
  tablaAmortizacion: CuotaAmortizacionDTO[];
  totalPagado: number;
  totalPendiente: number;
}

export class ObtenerEstadoCuentaUseCase {
  constructor(
    private readonly creditoRepo: ICreditoRepository,
    private readonly pagoCuotaRepo: IPagoCuotaRepository,
    private readonly socioRepo: ISocioRepository,
    private readonly calculador: CalculadorCuota,
    private readonly configService: ConfiguracionService,
  ) {}

  async execute(creditoId: string): Promise<EstadoCuentaResult> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Credito', creditoId);

    const [pagos, socio] = await Promise.all([
      this.pagoCuotaRepo.findByCreditoId(creditoId),
      this.socioRepo.findById(credito.socioId),
    ]);

    const tasaSeguro = await this.configService.getTasaSeguro();
    const tablaAmortizacion = this.calculador.generarTablaAmortizacion(
      Monto.create(credito.monto.value),
      credito.tasaMensual.value,
      credito.cuotas,
      tasaSeguro,
    );

    // Si hubo abonos al capital (saldoCapital menor al esperado), recalcular cuotas restantes
    const saldoEsperado =
      credito.cuotasPagadas > 0 && tablaAmortizacion.length >= credito.cuotasPagadas
        ? tablaAmortizacion[credito.cuotasPagadas - 1]!.saldoRestante.value
        : credito.monto.value;

    if (credito.cuotasRestantes > 0 && Math.abs(saldoEsperado - credito.saldoCapital.value) > 100) {
      const nuevaTabla = this.calculador.generarTablaAmortizacion(
        Monto.create(credito.saldoCapital.value),
        credito.tasaMensual.value,
        credito.cuotasRestantes,
        tasaSeguro,
      );
      for (let i = 0; i < nuevaTabla.length; i++) {
        const idx = credito.cuotasPagadas + i;
        if (idx < tablaAmortizacion.length) {
          const r = nuevaTabla[i]!;
          tablaAmortizacion[idx] = {
            numero: tablaAmortizacion[idx]!.numero,
            monto: r.monto,
            montoCapital: r.montoCapital,
            montoInteres: r.montoInteres,
            seguro: r.seguro,
            saldoRestante: r.saldoRestante,
          };
        }
      }
    }

    const totalPagado = pagos.reduce((sum, p) => sum + p.monto.value, 0);
    const totalPendiente = credito.saldoCapital.value;

    const primeraRestante = tablaAmortizacion.find((c) => c.numero > credito.cuotasPagadas);
    const cuotaMensual = primeraRestante ? primeraRestante.monto.value : credito.cuotaMensual.value;

    return {
      credito: {
        id: credito.id,
        socioId: credito.socioId,
        nombreSocio: socio?.nombre ?? '—',
        monto: credito.monto.value,
        tasaMensual: credito.tasaMensual.value,
        cuotas: credito.cuotas,
        cuotasPagadas: credito.cuotasPagadas,
        cuotasRestantes: credito.cuotasRestantes,
        saldoCapital: credito.saldoCapital.value,
        cuotaMensual,
        estado: credito.estado.toString(),
        fechaDesembolso: credito.fechaDesembolso,
        proposito: credito.proposito,
      },
      pagos: pagos.map((p) => ({
        id: p.id,
        numeroCuota: p.numeroCuota,
        monto: p.monto.value,
        montoCapital: p.montoCapital.value,
        montoInteres: p.montoInteres.value,
        fechaPago: p.fechaPago,
      })),
      tablaAmortizacion: tablaAmortizacion.map((c) => ({
        numeroCuota: c.numero,
        monto: c.monto.value,
        montoCapital: c.montoCapital.value,
        montoInteres: c.montoInteres.value,
        seguro: c.seguro.value,
        saldoRestante: c.saldoRestante.value,
      })),
      totalPagado,
      totalPendiente,
    };
  }
}
