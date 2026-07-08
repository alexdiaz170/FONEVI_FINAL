import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalcularMoraUseCase } from '../../../src/application/use-cases/mora/CalcularMoraUseCase.js';
import { MoraService, MoraCalculada } from '../../../src/domain/services/MoraService.js';
import { ConfiguracionService } from '../../../src/application/services/ConfiguracionService.js';

const mockMoraResult: MoraCalculada = {
  socioId: 'socio-1',
  socioNombre: 'Juan Pérez',
  aportesVencidos: 3,
  totalAdeudado: 375000,
  diasMora: 45,
  interesMora: 5625,
};

const mockMoraResult2: MoraCalculada = {
  socioId: 'socio-2',
  socioNombre: 'María López',
  aportesVencidos: 1,
  totalAdeudado: 125000,
  diasMora: 15,
  interesMora: 1250,
};

describe('CalcularMoraUseCase', () => {
  let mockMoraService: MoraService;
  let mockConfigService: ConfiguracionService;
  let useCase: CalcularMoraUseCase;

  beforeEach(() => {
    mockMoraService = {
      calcularMoraPorSocio: vi.fn(),
      listarSociosEnMora: vi.fn(),
    } as unknown as MoraService;

    mockConfigService = {
      getValor: vi.fn(),
      getTasaSeguro: vi.fn(),
      getMultiplicadorMaximoCredito: vi.fn(),
      getValorSolidaridad: vi.fn(),
      getTasaMoraMensual: vi.fn(),
      getValorMinimoAporte: vi.fn(),
      getTasaInteresMensual: vi.fn(),
    };

    vi.mocked(mockConfigService.getTasaMoraMensual).mockResolvedValue(2);

    useCase = new CalcularMoraUseCase(mockMoraService, mockConfigService);
  });

  it('should calculate mora for a specific socio', async () => {
    vi.mocked(mockMoraService.calcularMoraPorSocio).mockResolvedValue(mockMoraResult);

    const result = await useCase.execute('socio-1');

    expect(result).toEqual(mockMoraResult);
    expect(mockConfigService.getTasaMoraMensual).toHaveBeenCalledOnce();
    expect(mockMoraService.calcularMoraPorSocio).toHaveBeenCalledWith('socio-1', 2);
  });

  it('should calculate mora for all socios', async () => {
    vi.mocked(mockMoraService.listarSociosEnMora).mockResolvedValue([
      mockMoraResult,
      mockMoraResult2,
    ]);

    const result = await useCase.execute();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(mockConfigService.getTasaMoraMensual).toHaveBeenCalledOnce();
    expect(mockMoraService.listarSociosEnMora).toHaveBeenCalledWith(2);
  });

  it('should return empty array when no socios in mora', async () => {
    vi.mocked(mockMoraService.listarSociosEnMora).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should return empty array when socio-specific mora is null', async () => {
    vi.mocked(mockMoraService.calcularMoraPorSocio).mockResolvedValue(null);

    const result = await useCase.execute('socio-sin-mora');

    expect(result).toEqual([]);
    expect(mockMoraService.calcularMoraPorSocio).toHaveBeenCalledWith('socio-sin-mora', 2);
  });

  it('should fetch tasaMoraMensual from config before calculating', async () => {
    vi.mocked(mockMoraService.calcularMoraPorSocio).mockResolvedValue(mockMoraResult);

    await useCase.execute('socio-1');

    expect(mockConfigService.getTasaMoraMensual).toHaveBeenCalledBefore(
      mockMoraService.calcularMoraPorSocio as ReturnType<typeof vi.fn>,
    );
  });

  it('should pass tasaMora to listarSociosEnMora', async () => {
    vi.mocked(mockConfigService.getTasaMoraMensual).mockResolvedValue(5);
    vi.mocked(mockMoraService.listarSociosEnMora).mockResolvedValue([]);

    await useCase.execute();

    expect(mockMoraService.listarSociosEnMora).toHaveBeenCalledWith(5);
  });
});
