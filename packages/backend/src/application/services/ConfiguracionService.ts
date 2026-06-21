import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

export class ConfiguracionService {
  async getValor(clave: string): Promise<string | null> {
    const prisma = getPrismaClient();
    const config = await prisma.configuracion.findUnique({ where: { clave } });
    return config?.valor ?? null;
  }

  async getTasaSeguro(): Promise<number> {
    const val = await this.getValor('porcentaje_seguro');
    return Number(val ?? 0.5) / 1000;
  }

  async getMultiplicadorMaximoCredito(): Promise<number> {
    const val = await this.getValor('multiplicador_maximo_credito');
    return Number(val ?? 4);
  }

  async getValorSolidaridad(): Promise<number> {
    const val = await this.getValor('valor_solidaridad');
    return Number(val ?? 5000);
  }

  async getValorAhorroMensual(): Promise<number> {
    const val = await this.getValor('valor_ahorro_mensual');
    return Number(val ?? 125000);
  }

  async getTasaMoraMensual(): Promise<number> {
    const val = await this.getValor('tasa_mora_mensual');
    return Number(val ?? 0);
  }

  async getValorMinimoAporte(): Promise<number> {
    const val = await this.getValor('valor_minimo_aporte');
    return Number(val ?? 125000);
  }

  async getTasaInteresMensual(): Promise<number> {
    const val = await this.getValor('tasa_interes_mensual');
    return Number(val ?? 1);
  }

  async getReservas(): Promise<number> {
    const val = await this.getValor('reservas');
    return Number(val ?? 2500000);
  }
}
