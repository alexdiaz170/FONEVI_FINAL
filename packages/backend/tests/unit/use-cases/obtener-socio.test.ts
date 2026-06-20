import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObtenerSocioUseCase } from '../../../src/application/use-cases/socios/ObtenerSocioUseCase.js';
import { EliminarSocioUseCase } from '../../../src/application/use-cases/socios/EliminarSocioUseCase.js';
import { ISocioRepository } from '../../../src/domain/repositories/ISocioRepository.js';
import { Socio } from '../../../src/domain/entities/Socio.js';
import { Monto } from '@fonevi/shared';
import { TipoDocumento } from '../../../src/domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../../src/domain/value-objects/EstadoSocio.js';

describe('ObtenerSocioUseCase', () => {
  let mockRepo: ISocioRepository;
  let obtenerUseCase: ObtenerSocioUseCase;
  let eliminarUseCase: EliminarSocioUseCase;

  const mockSocio = Socio.create({
    codigo: 'S001',
    nombre: 'Juan Pérez',
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1234567890',
    fechaIngreso: new Date(),
    aporteMensual: Monto.create(125000),
    estado: EstadoSocio.ACTIVO,
  });

  beforeEach(() => {
    mockRepo = {
      findByIdOrCodigo: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSocio),
      findByDocumento: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      count: vi.fn(),
      obtenerMaximoSufijo: vi.fn().mockResolvedValue(0),
    };

    obtenerUseCase = new ObtenerSocioUseCase(mockRepo);
    eliminarUseCase = new EliminarSocioUseCase(mockRepo);
  });

  it('should find socio by id or codigo', async () => {
    vi.mocked(mockRepo.findByIdOrCodigo).mockResolvedValue(mockSocio);

    const socio = await obtenerUseCase.execute('S001');
    expect(socio.nombre).toBe('Juan Pérez');
    expect(mockRepo.findByIdOrCodigo).toHaveBeenCalledWith('S001');
  });

  it('should throw if socio not found', async () => {
    vi.mocked(mockRepo.findByIdOrCodigo).mockResolvedValue(null);

    await expect(obtenerUseCase.execute('INVALIDO')).rejects.toThrow(
      'Socio con id INVALIDO no encontrado',
    );
  });

  it('should soft delete socio', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockSocio);

    await eliminarUseCase.execute(mockSocio.id);
    expect(mockRepo.softDelete).toHaveBeenCalledWith(mockSocio.id);
  });

  it('should throw when deleting non-existent socio', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(eliminarUseCase.execute('no-existe')).rejects.toThrow(
      'Socio con id no-existe no encontrado',
    );
  });
});
