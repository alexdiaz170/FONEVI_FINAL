import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AprobarCreditoUseCase } from '../../../src/application/use-cases/creditos/AprobarCreditoUseCase.js';
import { Credito } from '../../../src/domain/entities/Credito.js';
import { Monto } from '@fonevi/shared';
import { TasaInteres } from '../../../src/domain/value-objects/TasaInteres.js';
import { EstadoCredito } from '../../../src/domain/value-objects/EstadoCredito.js';
import { ICreditoRepository } from '../../../src/domain/repositories/ICreditoRepository.js';

vi.mock('../../../src/infrastructure/persistence/prismaClient.js', () => {
  const mockPrisma = {
    creditoMovimiento: { create: vi.fn() },
    $transaction: vi.fn(async (fn: () => unknown) => fn()),
  };
  return {
    getPrismaClient: vi.fn(() => mockPrisma),
    disconnectPrisma: vi.fn(),
  };
});

describe('AprobarCreditoUseCase', () => {
  let mockCreditoRepo: ICreditoRepository;
  let useCase: AprobarCreditoUseCase;

  const pendingCredito = Credito.create({
    socioId: 'socio-1',
    monto: Monto.create(1000000),
    tasaMensual: TasaInteres.create(1),
    cuotas: 12,
    saldoCapital: Monto.create(1000000),
    fechaDesembolso: new Date(),
  });

  const activeCredito = Credito.fromPersistence({
    id: 'credito-2',
    socioId: 'socio-1',
    monto: Monto.create(1000000),
    tasaMensual: TasaInteres.create(1),
    cuotas: 12,
    cuotasPagadas: 0,
    saldoCapital: Monto.create(1000000),
    fechaDesembolso: new Date(),
    estado: EstadoCredito.ACTIVO,
  });

  beforeEach(() => {
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

    useCase = new AprobarCreditoUseCase(mockCreditoRepo);
  });

  it('should approve a pending credit successfully', async () => {
    vi.mocked(mockCreditoRepo.findById).mockResolvedValue(pendingCredito);
    vi.mocked(mockCreditoRepo.update).mockImplementation(async (c: Credito) => c);

    await useCase.execute(pendingCredito.id, 'admin-1');

    expect(mockCreditoRepo.findById).toHaveBeenCalledWith(pendingCredito.id);
    expect(mockCreditoRepo.update).toHaveBeenCalledOnce();
  });

  it('should throw EntityNotFoundError if credit does not exist', async () => {
    vi.mocked(mockCreditoRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('no-existe', 'admin-1')).rejects.toThrow(
      'Crédito con id no-existe no encontrado',
    );
  });

  it('should throw DomainError if credit is not in pending state', async () => {
    vi.mocked(mockCreditoRepo.findById).mockResolvedValue(activeCredito);

    await expect(useCase.execute(activeCredito.id, 'admin-1')).rejects.toThrow(
      'Solo se pueden aprobar créditos en estado pendiente',
    );
  });

  it('should call credito.aprobar() which returns a credit with ACTIVO state', async () => {
    vi.mocked(mockCreditoRepo.findById).mockResolvedValue(pendingCredito);
    vi.mocked(mockCreditoRepo.update).mockImplementation(async (c: Credito) => c);

    await useCase.execute(pendingCredito.id, 'aprobador-1');

    const updated = vi.mocked(mockCreditoRepo.update).mock.calls[0][0];
    expect(updated.estado.value).toBe('activo');
    expect(updated.aprobadoPor).toBe('aprobador-1');
  });

  it('should call repository.update() with the approved credit', async () => {
    vi.mocked(mockCreditoRepo.findById).mockResolvedValue(pendingCredito);
    vi.mocked(mockCreditoRepo.update).mockImplementation(async (c: Credito) => c);

    await useCase.execute(pendingCredito.id, 'admin-1');

    expect(mockCreditoRepo.update).toHaveBeenCalledTimes(1);
    const creditoPasado = vi.mocked(mockCreditoRepo.update).mock.calls[0][0];
    expect(creditoPasado).toBeInstanceOf(Credito);
    expect(creditoPasado.id).toBe(pendingCredito.id);
  });
});
