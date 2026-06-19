export interface ApiResponse<T = unknown> {
  ok: boolean;
  datos?: T;
  mensaje?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  datos: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
