import { config } from '../../../config/index.js';

export class VerEstadoWhatsAppUseCase {
  async execute() {
    const configurado = Boolean(config.whatsappApiUrl && config.whatsappToken);
    return {
      configurado,
      apiUrl: config.whatsappApiUrl || null,
      estado: configurado ? 'conectado' : 'no_configurado',
    };
  }
}
