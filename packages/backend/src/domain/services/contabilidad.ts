import { Monto } from '@fonevi/shared';

export interface BalanceGeneral {
  activos: {
    ahorros: number;
    creditosPorCobrar: number;
    solidaridad: number;
    reservas: number;
    total: number;
  };
  pasivos: {
    capitalSocial: number;
    total: number;
  };
  patrimonio: {
    resultadosAcumulados: number;
    total: number;
  };
}

export class CalculadorBalanceGeneral {
  calcular(
    totalAhorros: number,
    totalCreditosActivos: number,
    totalSolidaridad: number,
    reservasConfig: number,
    totalAportesRecibidos: number,
  ): BalanceGeneral {
    const ahorrosM = Monto.create(totalAhorros);
    const creditosM = Monto.create(totalCreditosActivos);
    const solidaridadM = Monto.create(totalSolidaridad);
    const reservasM = Monto.create(reservasConfig);

    const activos = ahorrosM.sumar(creditosM).sumar(solidaridadM).sumar(reservasM);
    const pasivos = Monto.create(totalAportesRecibidos);
    const patrimonio = activos.restar(pasivos);

    return {
      activos: {
        ahorros: ahorrosM.value,
        creditosPorCobrar: creditosM.value,
        solidaridad: solidaridadM.value,
        reservas: reservasM.value,
        total: activos.value,
      },
      pasivos: {
        capitalSocial: pasivos.value,
        total: pasivos.value,
      },
      patrimonio: {
        resultadosAcumulados: Math.max(0, patrimonio.value),
        total: Math.max(0, patrimonio.value),
      },
    };
  }
}
