import { Monto } from '@fonevi/shared';

export interface CreditoActivo {
  id: string;
  saldoCapital: Monto;
  tasaMensual: number;
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
    private readonly aporteSolidaridad: number = 5000,
    private readonly tasaSeguro: number = 0.005,
  ) {}

  distribuir(montoTotal: Monto, creditoActivo: CreditoActivo | null = null): DistribucionResult {
    const pagoSolidaridadValor = Math.min(montoTotal.value, this.aporteSolidaridad);
    const pagoSolidaridad = Monto.create(pagoSolidaridadValor);

    let restante = montoTotal.sumar(Monto.create(0)).restar(pagoSolidaridad);

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

      pagoInteres = Monto.create(Number((saldo.value * tasaDecimal).toFixed(2)));
      pagoInteres = restante.esMenorQue(pagoInteres) ? restante : pagoInteres;
      restante = restante.restar(pagoInteres);

      if (restante.value > 0) {
        pagoSeguro = Monto.create(Number((saldo.value * this.tasaSeguro).toFixed(2)));
        pagoSeguro = restante.esMenorQue(pagoSeguro) ? restante : pagoSeguro;
        restante = restante.restar(pagoSeguro);

        pagoCapital = restante;
        restante = Monto.create(0);

        const nuevoSaldoValor = Math.max(0, saldo.value - pagoCapital.value);
        nuevoSaldoCapital = Monto.create(nuevoSaldoValor);
        creditoPagado = nuevoSaldoValor <= 0;
        totalPagoCredito = pagoInteres.sumar(pagoSeguro).sumar(pagoCapital);
      } else {
        nuevoSaldoCapital = saldo;
        totalPagoCredito = pagoInteres;
      }
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
