import { Monto } from '@fonevi/shared';

export interface CreditoActivo {
  id: string;
  saldoCapital: Monto;
  tasaMensual: number;
  fechaDesembolso: Date;
  ultimoPagoFecha: Date | null;
  cuotaMensual?: Monto;
}

export interface DistribucionResult {
  pagoSolidaridad: Monto;
  pagoInteres: Monto;
  pagoSeguro: Monto;
  pagoCapital: Monto;
  totalPagoCredito: Monto;
  ahorro: Monto;
  nuevoSaldoCapital: Monto;
  creditoPagado: boolean;
}

export class DistribucionAporteService {
  constructor(
    private readonly aporteSolidaridad: number = 0,
    private readonly tasaSeguro: number = 0,
    private readonly aporteAhorroMensual: number = 0,
  ) {}

  distribuir(
    montoTotal: Monto,
    creditoActivo: CreditoActivo | null = null,
    tipoOperacion: string = 'cuota_normal',
    fechaPago: Date | null = null,
    aporteSolidaridadOverride?: number,
    tasaSeguroOverride?: number,
    aporteAhorroMensualOverride?: number,
  ): DistribucionResult {
    const aporteSolidaridad = aporteSolidaridadOverride ?? this.aporteSolidaridad;
    const tasaSeguro = tasaSeguroOverride ?? this.tasaSeguro;
    const ahorroMensual = aporteAhorroMensualOverride ?? this.aporteAhorroMensual;

    if (tipoOperacion === 'adelanto_cuotas' && !creditoActivo) {
      const costoPorPeriodo = aporteSolidaridad + ahorroMensual;
      const numPeriodos = Math.floor(montoTotal.value / costoPorPeriodo) || 1;
      const solidaridadTotal = numPeriodos * aporteSolidaridad;
      return {
        pagoSolidaridad: Monto.create(solidaridadTotal),
        pagoInteres: Monto.create(0),
        pagoSeguro: Monto.create(0),
        pagoCapital: Monto.create(0),
        totalPagoCredito: Monto.create(0),
        ahorro: Monto.create(montoTotal.value - solidaridadTotal),
        nuevoSaldoCapital: Monto.create(0),
        creditoPagado: false,
      };
    }

    const pagoSolidaridad =
      tipoOperacion === 'abono_credito'
        ? Monto.create(0)
        : Monto.create(Math.min(montoTotal.value, aporteSolidaridad));

    let restante = Monto.create(montoTotal.value).restar(pagoSolidaridad);

    let pagoInteres = Monto.create(0);
    let pagoSeguro = Monto.create(0);
    let pagoCapital = Monto.create(0);
    let totalPagoCredito = Monto.create(0);
    let nuevoSaldoCapital: Monto;
    let creditoPagado = false;
    let ahorro = Monto.create(0);

    if (creditoActivo && restante.value > 0) {
      const saldo = creditoActivo.saldoCapital;
      const tasaDecimal = creditoActivo.tasaMensual / 100;

      if (tipoOperacion === 'abono_credito') {
        pagoCapital = restante;
        pagoInteres = Monto.create(0);
        pagoSeguro = Monto.create(0);
        restante = Monto.create(0);
      } else {
        // Cuota normal: periodo fijo de 30 días (coincide con la tabla de amortización)
        pagoInteres = Monto.create(Number((saldo.value * tasaDecimal).toFixed(2)));
        pagoInteres = restante.esMenorQue(pagoInteres) ? restante : pagoInteres;
        restante = restante.restar(pagoInteres);

        if (restante.value > 0) {
          pagoSeguro = Monto.create(Number((saldo.value * tasaSeguro).toFixed(2)));
          pagoSeguro = restante.esMenorQue(pagoSeguro) ? restante : pagoSeguro;
          restante = restante.restar(pagoSeguro);
        }

        if (restante.value > 0) {
          // Scheduled capital from amortization table (cuotaMensual - interes - seguro)
          const scheduledCapital = creditoActivo.cuotaMensual
            ? Math.max(0, creditoActivo.cuotaMensual.value - pagoInteres.value - pagoSeguro.value)
            : restante.value;
          pagoCapital = Monto.create(Math.min(restante.value, scheduledCapital));
          restante = restante.restar(pagoCapital);
          // ALL remaining (including any excess over scheduled) goes to ahorro
          ahorro = restante;
          restante = Monto.create(0);
        }
      }

      const nuevoSaldoValor = Math.max(0, saldo.value - pagoCapital.value);
      nuevoSaldoCapital = Monto.create(nuevoSaldoValor);
      creditoPagado = nuevoSaldoValor <= 0;
      totalPagoCredito = pagoInteres.sumar(pagoSeguro).sumar(pagoCapital);
    } else {
      ahorro = restante;
      restante = Monto.create(0);
      nuevoSaldoCapital = creditoActivo?.saldoCapital ?? Monto.create(0);
    }

    return {
      pagoSolidaridad,
      pagoInteres,
      pagoSeguro,
      pagoCapital,
      totalPagoCredito,
      ahorro,
      nuevoSaldoCapital,
      creditoPagado,
    };
  }
}
