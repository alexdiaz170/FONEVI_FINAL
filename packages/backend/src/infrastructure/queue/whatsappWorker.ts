import { WhatsAppClient } from '@fonevi/external';
import { config } from '../../config/index.js';
import { IWaLogRepository } from '../../domain/repositories/IWaLogRepository.js';

export interface WhatsAppJobPayload {
  numero: string;
  template: string;
  variables?: Record<string, string>;
}

export function createWhatsAppProcessor(waLogRepo: IWaLogRepository) {
  const client = new WhatsAppClient(
    { apiUrl: config.whatsappApiUrl, token: config.whatsappToken },
    async (entry) => {
      await waLogRepo.create({
        numero: entry.numero,
        template: entry.template,
        estado: entry.estado,
        messageId: entry.messageId,
      });
    },
  );

  return async (payload: WhatsAppJobPayload): Promise<void> => {
    await client.sendMessage({
      numero: payload.numero,
      template: payload.template,
      variables: payload.variables,
    });
  };
}
