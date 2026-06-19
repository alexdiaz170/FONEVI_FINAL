import { Email, Monto, Telefono } from '@fonevi/shared';
import { Socio } from '../../../domain/entities/Socio.js';
import { TipoDocumento } from '../../../domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../../domain/value-objects/EstadoSocio.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import {
  GeneradorCodigoSocio,
  generarPasswordInicial,
} from '../../../domain/services/GeneradorCodigoSocio.js';
import { DomainError } from '../../../domain/errors.js';

export class CrearSocioUseCase {
  constructor(
    private readonly socioRepo: ISocioRepository,
    private readonly generadorCodigo: GeneradorCodigoSocio,
  ) {}

  async execute(dto: {
    codigo: string;
    nombre: string;
    tipoDocumento: string;
    numeroDocumento: string;
    email?: string | null;
    telefono?: string | null;
    fechaIngreso?: string;
    aporteMensual: number;
    ahorroAcumulado?: number;
    estado?: string;
    cargo?: string | null;
    sede?: string | null;
  }): Promise<{ socio: Socio; passwordInicial: string }> {
    const tipoDoc = TipoDocumento.create(dto.tipoDocumento);

    const existente = await this.socioRepo.findByDocumento(dto.numeroDocumento);
    if (existente) {
      throw new DomainError(
        `Ya existe un socio con documento: ${dto.numeroDocumento}`,
        'DOCUMENTO_ALREADY_EXISTS',
      );
    }

    const email = dto.email ? Email.create(dto.email) : null;
    const telefono = dto.telefono ? Telefono.create(dto.telefono) : null;
    const fechaIngreso = dto.fechaIngreso ? new Date(dto.fechaIngreso) : new Date();
    const aporteMensual = Monto.create(dto.aporteMensual);
    const ahorroAcumulado =
      dto.ahorroAcumulado !== undefined ? Monto.create(dto.ahorroAcumulado) : Monto.create(0);
    const estado = EstadoSocio.create(dto.estado ?? 'activo');

    const codigoSocio = await this.generadorCodigo.generar();
    const passwordInicial = generarPasswordInicial(dto.numeroDocumento);

    const socio = Socio.create({
      codigo: dto.codigo,
      codigoSocio,
      nombre: dto.nombre,
      tipoDocumento: tipoDoc,
      numeroDocumento: dto.numeroDocumento,
      email,
      telefono,
      fechaIngreso,
      aporteMensual,
      ahorroAcumulado,
      estado,
      cargo: dto.cargo ?? null,
      sede: dto.sede ?? null,
    });

    const saved = await this.socioRepo.save(socio);

    return { socio: saved, passwordInicial };
  }
}
