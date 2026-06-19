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
  if (!texto) return 'fono1234';
  return texto.length > 4 ? texto.slice(-4) : texto;
}
