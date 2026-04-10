export interface ApiResponseEnvelope<T = unknown> {
  code: string;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  errorKey?: string;
  details?: unknown;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
}
