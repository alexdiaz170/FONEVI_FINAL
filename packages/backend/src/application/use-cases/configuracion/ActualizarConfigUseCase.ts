import { Configuracion } from '../../../domain/entities/Configuracion.js';
import { IConfiguracionRepository } from '../../../domain/repositories/IConfiguracionRepository.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class ActualizarConfigUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async execute(clave: string, valor: string, usuarioId?: string): Promise<Configuracion> {
    const existente = await this.configRepo.findByClave(clave);
    const prisma = getPrismaClient();

    if (existente) {
      const saved = await prisma.$transaction(async () => {
        const result = await this.configRepo.save(existente.actualizarValor(valor));
        await prisma.configuracionHistorial.create({
          data: {
            clave,
            valorAnterior: existente.valor,
            valorNuevo: valor,
            usuarioId,
          },
        });
        return result;
      });
      return saved;
    }

    const saved = await prisma.$transaction(async () => {
      const result = await this.configRepo.save(Configuracion.create({ clave, valor }));
      await prisma.configuracionHistorial.create({
        data: {
          clave,
          valorAnterior: null,
          valorNuevo: valor,
          usuarioId,
        },
      });
      return result;
    });
    return saved;
  }
}
