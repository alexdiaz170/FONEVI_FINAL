import { IWaLogRepository } from '../../../domain/repositories/IWaLogRepository.js';
import type { WaLogFilter } from '../../../domain/repositories/IWaLogRepository.js';

export class ListarLogsWhatsAppUseCase {
  constructor(private readonly waLogRepo: IWaLogRepository) {}

  async execute(filters: WaLogFilter) {
    return await this.waLogRepo.findAll(filters);
  }
}
