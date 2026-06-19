import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearSocioUseCase } from '../../../src/application/use-cases/socios/CrearSocioUseCase.js';
import { GeneradorCodigoSocio } from '../../../src/domain/services/GeneradorCodigoSocio.js';
import { ISocioRepository } from '../../../src/domain/repositories/ISocioRepository.js';
import { Socio } from '../../../src/domain/entities/Socio.js';
import { Monto, Email } from '@fonevi/shared';
import { TipoDocumento } from '../../../src/domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../../src/domain/value-objects/EstadoSocio.js';

describe('CrearSocioUseCase', () => {
  let mockRepo: ISocioRepository;
  let mockCodigoRepo: GeneradorCodigoSocio;
  let useCase: CrearSocioUseCase;

  const validDto = {
    codigo: 'S001',
    nombre: 'Juan Pérez',
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    email: 'juan@example.com',
    telefono: '3001234567',
    aporteMensual: 50000,
    ahorroAcumulado: 100000,
    estado: 'activo',
    cargo: 'Presidente',
    sede: 'Bogotá',
  };

  beforeEach(() => {
    mockRepo = {
      findByDocumento: vi.fn().mockResolvedValue(null),
      findByIdOrCodigo: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn().mockImplementation(async (socio: Socio) => socio),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      count: vi.fn(),
      obtenerMaximoSufijo: vi.fn().mockResolvedValue(5),
    };

    mockCodigoRepo = new GeneradorCodigoSocio(mockRepo);
    useCase = new CrearSocioUseCase(mockRepo, mockCodigoRepo);
  });

  it('should create a socio successfully', async () => {
    const result = await useCase.execute(validDto);

    expect(result.socio.nombre).toBe('Juan Pérez');
    expect(result.socio.codigoSocio).toBe('SOC-0006');
    expect(result.passwordInicial).toBe('7890');
    expect(mockRepo.findByDocumento).toHaveBeenCalledWith('1234567890');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('should throw if documento already exists', async () => {
    const existingSocio = Socio.create({
      codigo: 'S002',
      nombre: 'Existente',
      tipoDocumento: TipoDocumento.CC,
      numeroDocumento: '1234567890',
      fechaIngreso: new Date(),
      aporteMensual: Monto.create(50000),
      estado: EstadoSocio.ACTIVO,
    });

    vi.mocked(mockRepo.findByDocumento).mockResolvedValue(existingSocio);

    await expect(useCase.execute(validDto)).rejects.toThrow(
      'Ya existe un socio con documento: 1234567890',
    );
  });

  it('should throw for invalid tipo documento', async () => {
    await expect(useCase.execute({ ...validDto, tipoDocumento: 'INVALIDO' })).rejects.toThrow(
      'Tipo de documento inválido',
    );
  });

  it('should throw for invalid email', async () => {
    await expect(useCase.execute({ ...validDto, email: 'no-email' })).rejects.toThrow(
      'Email inválido',
    );
  });

  it('should throw for negative aporte', async () => {
    await expect(useCase.execute({ ...validDto, aporteMensual: -100 })).rejects.toThrow(
      'Monto inválido',
    );
  });

  it('should generate password from last 4 digits of documento', async () => {
    const result = await useCase.execute({ ...validDto, numeroDocumento: '123456' });
    expect(result.passwordInicial).toBe('3456');
  });
});
