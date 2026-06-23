export interface ICodigoSocioRepository {
  obtenerMaximoSufijo(): Promise<number>;
}

export class GeneradorCodigoSocio {
  constructor(private readonly repo: ICodigoSocioRepository) {}

  async generar(): Promise<string> {
    const maxSufijo = await this.repo.obtenerMaximoSufijo();
    const siguiente = (maxSufijo + 1).toString().padStart(4, '0');
    return `SOC-${siguiente}`;
  }
}

export function generarPasswordInicial(documento: string): string {
  const texto = String(documento || '').trim();
  if (!texto) return 'fono123456';
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length >= 6) return digitos.slice(-6);
  if (digitos.length > 0) return digitos.padStart(6, '0');
  return 'fono123456';
}
