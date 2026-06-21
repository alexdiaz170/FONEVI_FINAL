import { Monto } from '@fonevi/shared';

export interface CuotaCalculada {
  numero: number;
  monto: Monto;
  montoCapital: Monto;
  montoInteres: Monto;
  seguro: Monto;
  saldoRestante: Monto;
}

export class CalculadorCuota {
  calcularCuotaFija(monto: Monto, tasaMensual: number, cuotas: number): Monto {
    if (cuotas === 0) return Monto.create(0);
    const r = tasaMensual / 100;
    const n = cuotas;
    const p = monto.value;
    if (r === 0) return Monto.create(Math.round(p / n));
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Monto.create(Math.round(p * factor));
  }

  calcularCuotaFijaConSeguro(
    monto: Monto,
    tasaMensual: number,
    cuotas: number,
    tasaSeguro: number,
  ): Monto {
    const r = tasaMensual / 100 + tasaSeguro;
    if (cuotas === 0) return Monto.create(0);
    const n = cuotas;
    const p = monto.value;
    if (r === 0) return Monto.create(Math.round(p / n));
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Monto.create(Math.round(p * factor));
  }

  generarTablaAmortizacion(
    monto: Monto,
    tasaMensual: number,
    cuotas: number,
    tasaSeguro: number,
  ): CuotaCalculada[] {
    const ri = Math.round((tasaMensual / 100) * 1e6) / 1e6;
    const ts = tasaSeguro;
    const cuotaFija = this.calcularCuotaFijaConSeguro(monto, tasaMensual, cuotas, tasaSeguro).value;
    let saldo = monto.value;
    const tabla: CuotaCalculada[] = [];

    for (let i = 1; i <= cuotas; i++) {
      const interes = Math.round(saldo * ri);
      const seguro = Math.round(saldo * ts);

      if (i === cuotas) {
        const capital = saldo;
        tabla.push({
          numero: i,
          monto: Monto.create(interes + seguro + capital),
          montoCapital: Monto.create(capital),
          montoInteres: Monto.create(interes),
          seguro: Monto.create(seguro),
          saldoRestante: Monto.create(0),
        });
      } else {
        let capital = cuotaFija - interes - seguro;
        if (capital < 0) capital = 0;
        saldo = saldo - capital;
        tabla.push({
          numero: i,
          monto: Monto.create(cuotaFija),
          montoCapital: Monto.create(capital),
          montoInteres: Monto.create(interes),
          seguro: Monto.create(seguro),
          saldoRestante: Monto.create(saldo),
        });
      }
    }

    return tabla;
  }

  calcularCuotaActual(
    saldoCapital: Monto,
    tasaMensual: number,
    cuotasRestantes: number,
    cuotaFija: Monto,
    tasaSeguro: number,
  ): CuotaCalculada {
    const ri = Math.round((tasaMensual / 100) * 1e6) / 1e6;
    const ts = tasaSeguro;
    const interes = Math.round(saldoCapital.value * ri);
    const seguro = Math.round(saldoCapital.value * ts);
    const capital = Math.max(0, cuotaFija.value - interes - seguro);
    const nuevoSaldo = Math.max(0, saldoCapital.value - capital);

    return {
      numero: 0,
      monto: cuotaFija,
      montoCapital: Monto.create(Math.min(capital, saldoCapital.value)),
      montoInteres: Monto.create(interes),
      seguro: Monto.create(seguro),
      saldoRestante: Monto.create(nuevoSaldo),
    };
  }
}

export class CalculadorInteresesMora {
  calcular(tasaMensual: number, saldoVencido: Monto, diasMora: number): Monto {
    const tasaDiaria = tasaMensual / 100 / 30;
    const interesMora = saldoVencido.value * tasaDiaria * diasMora;
    return Monto.create(Math.round(interesMora));
  }
}
