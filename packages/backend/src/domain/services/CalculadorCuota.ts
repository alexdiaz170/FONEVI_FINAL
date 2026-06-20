import { Monto } from '@fonevi/shared';

const TASA_SEGURO = 0.05 / 1000;

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
    if (r === 0) return Monto.create(Math.round((p / n) * 100) / 100);
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Monto.create(Math.round(p * factor * 100) / 100);
  }

  generarTablaAmortizacion(monto: Monto, tasaMensual: number, cuotas: number): CuotaCalculada[] {
    const cuotaFija = this.calcularCuotaFija(monto, tasaMensual, cuotas);
    const r = tasaMensual / 100;
    let saldo = monto.value;
    const tabla: CuotaCalculada[] = [];

    for (let i = 1; i <= cuotas; i++) {
      const interes = Math.round(saldo * r * 100) / 100;
      const capital = Math.round((cuotaFija.value - interes) * 100) / 100;
      const seguro = Math.round(saldo * TASA_SEGURO * 100) / 100;
      saldo = Math.round((saldo - capital) * 100) / 100;
      if (i === cuotas) {
        const ajuste = Math.round(saldo * 100) / 100;
        tabla.push({
          numero: i,
          monto: Monto.create(cuotaFija.value + ajuste),
          montoCapital: Monto.create(capital + ajuste),
          montoInteres: Monto.create(interes),
          seguro: Monto.create(seguro),
          saldoRestante: Monto.create(0),
        });
      } else {
        tabla.push({
          numero: i,
          monto: cuotaFija,
          montoCapital: Monto.create(capital),
          montoInteres: Monto.create(interes),
          seguro: Monto.create(seguro),
          saldoRestante: Monto.create(Math.max(0, saldo)),
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
  ): CuotaCalculada {
    const r = tasaMensual / 100;
    const interes = Math.round(saldoCapital.value * r * 100) / 100;
    const capital = Math.round((cuotaFija.value - interes) * 100) / 100;
    const nuevoSaldo = Math.round((saldoCapital.value - capital) * 100) / 100;

    const seguro = Math.round(saldoCapital.value * TASA_SEGURO * 100) / 100;
    return {
      numero: 0,
      monto: cuotaFija,
      montoCapital: Monto.create(Math.min(capital, saldoCapital.value)),
      montoInteres: Monto.create(interes),
      seguro: Monto.create(seguro),
      saldoRestante: Monto.create(Math.max(0, nuevoSaldo)),
    };
  }
}

export class CalculadorInteresesMora {
  calcular(tasaMensual: number, saldoVencido: Monto, diasMora: number): Monto {
    const tasaDiaria = tasaMensual / 100 / 30;
    const interesMora = saldoVencido.value * tasaDiaria * diasMora;
    return Monto.create(Math.round(interesMora * 100) / 100);
  }
}
