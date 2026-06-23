export interface WaLogEntry {
  id: string;
  numero: string;
  template: string;
  estado: string;
  messageId: string | null;
  enviadoEn: Date;
  createdAt: Date;
}

export interface WaLogFilter {
  estado?: string;
  numero?: string;
  page?: number;
  limit?: number;
}

export interface WaLogListResult {
  data: WaLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IWaLogRepository {
  create(data: {
    numero: string;
    template: string;
    estado: string;
    messageId?: string | null;
    enviadoEn?: Date;
  }): Promise<WaLogEntry>;
  findAll(filters?: WaLogFilter): Promise<WaLogListResult>;
}
