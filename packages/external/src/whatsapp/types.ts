export interface WhatsAppMessage {
  numero: string;
  template: string;
  variables?: Record<string, string>;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppConfig {
  apiUrl: string;
  token: string;
}
