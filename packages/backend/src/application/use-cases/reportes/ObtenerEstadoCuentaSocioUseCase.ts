import { Monto } from '@fonevi/shared';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';
import { CalculadorCuota } from '../../../domain/services/CalculadorCuota.js';

export interface EstadoCuentaSocioResult {
  socio: {
    id: string;
    nombre: string;
    documento: string;
    email: string | null;
    telefono: string | null;
    fechaIngreso: Date;
    estado: string;
    ahorroAcumulado: number;
  };
  creditos: Array<{
    id: string;
    monto: number;
    saldoCapital: number;
    cuotas: number;
    cuotasPagadas: number;
    cuotaMensual: number;
    tasaMensual: number;
    fechaDesembolso: Date;
    estado: string;
    proposito: string | null;
    totalPagado: number;
    pagos: Array<{
      numeroCuota: number;
      monto: number;
      montoCapital: number;
      montoInteres: number;
      fechaPago: Date;
    }>;
  }>;
  aportes: Array<{
    id: string;
    periodoId: number;
    periodoNombre: string;
    monto: number;
    fechaPago: Date | null;
    estado: string;
    tipoOperacion: string;
    pagoSolidaridad: number;
    pagoCredito: number;
    ahorro: number;
  }>;
  totalAportado: number;
}

export class ObtenerEstadoCuentaSocioUseCase {
  async execute(socioId: string): Promise<EstadoCuentaSocioResult> {
    const prisma = getPrismaClient();

    const [socio, creditos, aportes] = await Promise.all([
      prisma.socio.findUnique({
        where: { id: socioId },
        select: {
          id: true,
          nombre: true,
          documento: true,
          email: true,
          telefono: true,
          fechaIngreso: true,
          estado: true,
          ahorroAcumulado: true,
        },
      }),
      prisma.credito.findMany({
        where: { socioId, estado: 'activo', deletedAt: null },
        include: { pagoCuotas: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aporte.findMany({
        where: { socioId, estado: 'pagado' },
        include: { detalle: true, periodo: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!socio) throw new Error('Socio no encontrado');

    const calculador = new CalculadorCuota();
    const seguroCfg = await prisma.configuracion.findUnique({
      where: { clave: 'porcentaje_seguro' },
    });
    const tasaSeguro = Number(seguroCfg?.valor ?? 0.5) / 1000;

    const creditosMap = creditos.map((c) => ({
      id: c.id,
      monto: Number(c.monto),
      saldoCapital: Number(c.saldoCapital),
      cuotas: c.cuotas,
      cuotasPagadas: c.cuotasPagadas,
      cuotaMensual: calculador.calcularCuotaFijaConSeguro(
        Monto.create(Number(c.monto)),
        Number(c.tasaMensual),
        c.cuotas,
        tasaSeguro,
      ).value,
      tasaMensual: Number(c.tasaMensual),
      fechaDesembolso: c.fechaDesembolso,
      estado: c.estado,
      proposito: c.proposito,
      totalPagado: c.pagoCuotas.reduce((s, p) => s + Number(p.monto), 0),
      pagos: c.pagoCuotas.map((p) => ({
        numeroCuota: p.numeroCuota,
        monto: Number(p.monto),
        montoCapital: Number(p.montoCapital),
        montoInteres: Number(p.montoInteres),
        fechaPago: p.fechaPago,
      })),
    }));

    const totalAportado = aportes.reduce((s, a) => s + Number(a.monto), 0);

    return {
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        documento: socio.documento,
        email: socio.email,
        telefono: socio.telefono,
        fechaIngreso: socio.fechaIngreso,
        estado: socio.estado,
        ahorroAcumulado: Number(socio.ahorroAcumulado),
      },
      creditos: creditosMap,
      aportes: aportes.map((a) => {
        const d = a.detalle;
        const tipoOp =
          d && Number(d.interes) > 0
            ? 'cuota_normal'
            : d && Number(d.capital) > 0
              ? 'abono_credito'
              : 'adelanto_cuotas';
        const pagoSolidaridad = Number(a.pagoSolidaridad);
        const pagoCredito = Number(a.pagoCredito);
        const ahorro = Math.max(0, Number(a.monto) - pagoSolidaridad - pagoCredito);
        return {
          id: a.id,
          periodoId: a.periodoId,
          periodoNombre: a.periodo?.nombre ?? `Periodo ${a.periodoId}`,
          monto: Number(a.monto),
          fechaPago: a.fechaPago,
          estado: a.estado,
          tipoOperacion: tipoOp,
          pagoSolidaridad,
          pagoCredito,
          ahorro,
        };
      }),
      totalAportado,
    };
  }
}
