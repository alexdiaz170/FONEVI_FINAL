import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SolicitarCreditoUseCase } from '../../../src/application/use-cases/creditos/SolicitarCreditoUseCase.js';
import { Credito } from '../../../src/domain/entities/Credito.js';
import { Socio } from '../../../src/domain/entities/Socio.js';
import { Monto } from '@fonevi/shared';
import { TasaInteres } from '../../../src/domain/value-objects/TasaInteres.js';
import { TipoDocumento } from '../../../src/domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../../src/domain/value-objects/EstadoSocio.js';
import { ISocioRepository } from '../../../src/domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../../src/domain/repositories/ICreditoRepository.js';
import { ConfiguracionService } from '../../../src/application/services/ConfiguracionService.js';

vi.mock('../../../src/infrastructure/persistence/prismaClient.js', () => ({
  getPrismaClient: vi.fn(() => ({
    creditoMovimiento: { create: vi.fn().mockResolvedValue(undefined) },
  })),
}));

describe('SolicitarCreditoUseCase', () => {
  let mockSocioRepo: ISocioRepository;
  let mockCreditoRepo: ICreditoRepository;
  let mockConfigService: ConfiguracionService;
  let useCase: SolicitarCreditoUseCase;

  const activeSocio = Socio.create({
    codigo: 'S001',
    nombre: 'Juan Pérez',
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1234567890',
    fechaIngreso: new Date(),
    aporteMensual: Monto.create(125000),
    ahorroAcumulado: Monto.create(100000),
    estado: EstadoSocio.ACTIVO,
  });

  beforeEach(() => {
    mockSocioRepo = {
      findById: vi.fn(),
      findByIdOrCodigo: vi.fn(),
      findByDocumento: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      findPaginated: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      count: vi.fn(),
      countByEstado: vi.fn(),
      obtenerMaximoSufijo: vi.fn(),
    };

    mockCreditoRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findActiveOrPendingBySocioId: vi.fn(),
      sumSaldoCapitalBySocioId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      countByEstado: vi.fn(),
      sumMontoByEstados: vi.fn(),
      sumSaldoCapitalByEstado: vi.fn(),
      countDistinctSocioIdByEstados: vi.fn(),
    };

    mockConfigService = {
      getValor: vi.fn(),
      getTasaSeguro: vi.fn(),
      getMultiplicadorMaximoCredito: vi.fn(),
      getValorSolidaridad: vi.fn(),
      getTasaMoraMensual: vi.fn(),
      getValorMinimoAporte: vi.fn(),
      getTasaInteresMensual: vi.fn(),
    };

    vi.mocked(mockSocioRepo.findById).mockResolvedValue(activeSocio);
    vi.mocked(mockCreditoRepo.sumSaldoCapitalBySocioId).mockResolvedValue(0);
    vi.mocked(mockConfigService.getMultiplicadorMaximoCredito).mockResolvedValue(4);
    vi.mocked(mockConfigService.getTasaInteresMensual).mockResolvedValue(1);
    vi.mocked(mockCreditoRepo.save).mockImplementation(async (c: Credito) => c);

    useCase = new SolicitarCreditoUseCase(mockSocioRepo, mockCreditoRepo, mockConfigService);
  });

  it('should create a credit successfully for a valid socio', async () => {
    const credito = await useCase.execute({
      socioId: activeSocio.id,
      monto: 200000,
      cuotas: 12,
    });

    expect(credito.socioId).toBe(activeSocio.id);
    expect(credito.monto.value).toBe(200000);
    expect(credito.cuotas).toBe(12);
    expect(credito.estado.value).toBe('pendiente');
    expect(mockSocioRepo.findById).toHaveBeenCalledWith(activeSocio.id);
    expect(mockCreditoRepo.save).toHaveBeenCalledOnce();
  });

  it('should throw EntityNotFoundError if socio does not exist', async () => {
    vi.mocked(mockSocioRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ socioId: 'no-existe', monto: 200000, cuotas: 12 }),
    ).rejects.toThrow('Socio con id no-existe no encontrado');
  });

  it('should throw DomainError if socio is not active', async () => {
    const suspendedSocio = Socio.create({
      codigo: 'S002',
      nombre: 'Suspendido',
      tipoDocumento: TipoDocumento.CC,
      numeroDocumento: '9999999999',
      fechaIngreso: new Date(),
      aporteMensual: Monto.create(125000),
      ahorroAcumulado: Monto.create(100000),
      estado: EstadoSocio.SUSPENDIDO,
    });
    vi.mocked(mockSocioRepo.findById).mockResolvedValue(suspendedSocio);

    await expect(
      useCase.execute({ socioId: suspendedSocio.id, monto: 200000, cuotas: 12 }),
    ).rejects.toThrow('El socio no puede solicitar créditos en su estado actual');
  });

  it('should throw DomainError if amount exceeds max allowed', async () => {
    vi.mocked(mockCreditoRepo.sumSaldoCapitalBySocioId).mockResolvedValue(50000);

    await expect(
      useCase.execute({ socioId: activeSocio.id, monto: 400000, cuotas: 12 }),
    ).rejects.toThrow('excede el máximo disponible');
  });

  it('should use custom tasaMensual when provided by admin', async () => {
    const credito = await useCase.execute(
      { socioId: activeSocio.id, monto: 200000, cuotas: 12, tasaMensual: 2.5 },
      'admin',
    );

    expect(credito.tasaMensual.value).toBe(2.5);
    expect(mockConfigService.getTasaInteresMensual).not.toHaveBeenCalled();
  });

  it('should use default tasaMensual from config when not provided', async () => {
    const credito = await useCase.execute({ socioId: activeSocio.id, monto: 200000, cuotas: 12 });

    expect(credito.tasaMensual.value).toBe(1);
    expect(mockConfigService.getTasaInteresMensual).toHaveBeenCalled();
  });

  it('should create credit with optional proposito and notas', async () => {
    const credito = await useCase.execute({
      socioId: activeSocio.id,
      monto: 300000,
      cuotas: 24,
      proposito: 'Compra de materiales',
      notas: 'Aprobación pendiente de gerencia',
    });

    expect(credito.proposito).toBe('Compra de materiales');
    expect(credito.notas).toBe('Aprobación pendiente de gerencia');
    expect(credito.cuotas).toBe(24);
  });
});
