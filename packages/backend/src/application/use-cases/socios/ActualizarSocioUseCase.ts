import { Email, Monto, Telefono } from '@fonevi/shared';
import { Socio } from '../../../domain/entities/Socio.js';
import { EstadoSocio } from '../../../domain/value-objects/EstadoSocio.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { DomainError } from '../../../domain/errors.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class ActualizarSocioUseCase {
  constructor(private readonly socioRepo: ISocioRepository) {}

  async execute(
    id: string,
    dto: {
      nombre?: string;
      email?: string | null;
      telefono?: string | null;
      fechaIngreso?: string;
      aporteMensual?: number;
      ahorroAcumulado?: number;
      estado?: string;
      cargo?: string | null;
      sede?: string | null;
      departamento?: string | null;
      municipio?: string | null;
    },
  ): Promise<Socio> {
    const socio = await this.socioRepo.findById(id);
    if (!socio || socio.estaEliminado()) {
      throw new EntityNotFoundError('Socio', id);
    }

    const actualizaciones: Partial<{
      nombre: string;
      email: Email | null;
      telefono: Telefono | null;
      fechaIngreso: Date;
      aporteMensual: Monto;
      ahorroAcumulado: Monto;
      estado: EstadoSocio;
      cargo: string | null;
      sede: string | null;
      departamento: string | null;
      municipio: string | null;
    }> = {};

    if (dto.nombre !== undefined) actualizaciones.nombre = dto.nombre;
    if (dto.email !== undefined) actualizaciones.email = dto.email ? Email.create(dto.email) : null;
    if (dto.telefono !== undefined)
      actualizaciones.telefono = dto.telefono ? Telefono.create(dto.telefono) : null;
    if (dto.fechaIngreso !== undefined) actualizaciones.fechaIngreso = new Date(dto.fechaIngreso);
    if (dto.aporteMensual !== undefined)
      actualizaciones.aporteMensual = Monto.create(dto.aporteMensual);
    if (dto.ahorroAcumulado !== undefined)
      actualizaciones.ahorroAcumulado = Monto.create(dto.ahorroAcumulado);
    if (dto.estado !== undefined) actualizaciones.estado = EstadoSocio.create(dto.estado);
    if (dto.cargo !== undefined) actualizaciones.cargo = dto.cargo ?? null;
    if (dto.sede !== undefined) actualizaciones.sede = dto.sede ?? null;
    if (dto.departamento !== undefined) actualizaciones.departamento = dto.departamento ?? null;
    if (dto.municipio !== undefined) actualizaciones.municipio = dto.municipio ?? null;

    const actualizado = socio.actualizarDatos(actualizaciones);
    return this.socioRepo.update(actualizado);
  }
}
