import { getPrismaClient } from '../persistence/prismaClient.js';
import { config } from '../../config/index.js';

export interface WhatsAppMessage {
  numero: string;
  template: string;
  variables?: Record<string, string>;
}

export class WhatsAppService {
  private readonly apiUrl: string;
  private readonly token: string;

  constructor() {
    this.apiUrl = config.whatsappApiUrl ?? '';
    this.token = config.whatsappToken ?? '';
  }

  async sendMessage(
    msg: WhatsAppMessage,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const prisma = getPrismaClient();

    if (!this.apiUrl || !this.token) {
      await prisma.waLog.create({
        data: {
          numero: msg.numero,
          template: msg.template,
          estado: 'config_error',
          enviadoEn: new Date(),
        } as never,
      });
      return { success: false, error: 'WhatsApp no configurado' };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: msg.numero,
          type: 'template',
          template: {
            name: msg.template,
            language: { code: 'es' },
            components: msg.variables
              ? [
                  {
                    type: 'body',
                    parameters: Object.values(msg.variables).map((v) => ({
                      type: 'text',
                      text: v,
                    })),
                  },
                ]
              : [],
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        await prisma.waLog.create({
          data: {
            numero: msg.numero,
            template: msg.template,
            estado: 'error',
            enviadoEn: new Date(),
          } as never,
        });
        return { success: false, error: `HTTP ${response.status}: ${errorBody}` };
      }

      const data = (await response.json()) as { messages?: { id: string }[] };
      const messageId = data.messages?.[0]?.id;

      await prisma.waLog.create({
        data: {
          numero: msg.numero,
          template: msg.template,
          estado: messageId ? 'enviado' : 'pendiente',
          messageId: messageId ?? null,
          enviadoEn: new Date(),
        } as never,
      });

      return { success: true, messageId };
    } catch (error) {
      await prisma.waLog.create({
        data: {
          numero: msg.numero,
          template: msg.template,
          estado: 'error',
          enviadoEn: new Date(),
        } as never,
      });
      return { success: false, error: String(error) };
    }
  }
}
