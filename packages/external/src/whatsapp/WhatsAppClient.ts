import type { WhatsAppMessage, WhatsAppResult, WhatsAppConfig } from './types.js';

type LogFn = (entry: {
  numero: string;
  template: string;
  estado: string;
  messageId?: string;
  error?: string;
}) => void;

export class WhatsAppClient {
  private readonly apiUrl: string;
  private readonly token: string;
  private onLog?: LogFn;

  constructor(config: WhatsAppConfig, onLog?: LogFn) {
    this.apiUrl = config.apiUrl;
    this.token = config.token;
    this.onLog = onLog;
  }

  setLogger(fn: LogFn): void {
    this.onLog = fn;
  }

  async sendMessage(msg: WhatsAppMessage): Promise<WhatsAppResult> {
    if (!this.apiUrl || !this.token) {
      this.log({
        numero: msg.numero,
        template: msg.template,
        estado: 'config_error',
        error: 'WhatsApp no configurado',
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
        this.log({
          numero: msg.numero,
          template: msg.template,
          estado: 'error',
          error: `HTTP ${response.status}: ${errorBody}`,
        });
        return { success: false, error: `HTTP ${response.status}: ${errorBody}` };
      }

      const data = (await response.json()) as { messages?: { id: string }[] };
      const messageId = data.messages?.[0]?.id;

      this.log({
        numero: msg.numero,
        template: msg.template,
        estado: messageId ? 'enviado' : 'pendiente',
        messageId,
      });
      return { success: true, messageId };
    } catch (error) {
      this.log({
        numero: msg.numero,
        template: msg.template,
        estado: 'error',
        error: String(error),
      });
      return { success: false, error: String(error) };
    }
  }

  private log(entry: {
    numero: string;
    template: string;
    estado: string;
    messageId?: string;
    error?: string;
  }): void {
    this.onLog?.(entry);
  }
}
