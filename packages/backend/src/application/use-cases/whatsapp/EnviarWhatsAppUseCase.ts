import { WhatsAppClient } from '@fonevi/external';
import { IWaLogRepository } from '../../../domain/repositories/IWaLogRepository.js';
import { config } from '../../../config/index.js';
import type { EnviarWhatsAppDTO } from '../../dto/whatsapp.dto.js';
import type { Queue } from 'bullmq';
import { enqueue } from '../../../infrastructure/queue/JobQueue.js';

export class EnviarWhatsAppUseCase {
  private readonly whatsAppClient: WhatsAppClient;

  constructor(
    private readonly waLogRepo: IWaLogRepository,
    private readonly queue: Queue | null = null,
  ) {
    this.whatsAppClient = new WhatsAppClient(
      { apiUrl: config.whatsappApiUrl, token: config.whatsappToken },
      async (entry) => {
        await this.waLogRepo.create({
          numero: entry.numero,
          template: entry.template,
          estado: entry.estado,
          messageId: entry.messageId,
        });
      },
    );
  }

  async execute(dto: EnviarWhatsAppDTO) {
    if (this.queue) {
      const jobId = await enqueue(this.queue, {
        numero: dto.numero,
        template: dto.template,
        variables: dto.variables as Record<string, string> | undefined,
      });
      return { encolado: true, jobId };
    }

    const result = await this.whatsAppClient.sendMessage({
      numero: dto.numero,
      template: dto.template,
      variables: dto.variables as Record<string, string> | undefined,
    });

    return result;
  }
}
