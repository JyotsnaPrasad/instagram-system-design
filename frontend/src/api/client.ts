import type { ApiErrorBody } from './types';

export const ACTING_USER_HEADER = 'X-Acting-User';

/** Any failed API call. `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;

  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

const UNREACHABLE = "Can't reach the server. Check that the backend is running on port 8080.";

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Sent as X-Acting-User. Passed per call so a request in flight keeps the user it started with. */
  actingUserId?: string;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.actingUserId) headers[ACTING_USER_HEADER] = options.actingUserId;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', UNREACHABLE);
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as T;

  if (isErrorBody(data)) {
    throw new ApiError(data.status, data.code, data.message, data.field);
  }
  // A non-JSON error usually means the Vite proxy could not reach the backend.
  const message = response.status >= 500 ? UNREACHABLE : `Request failed (${response.status}).`;
  throw new ApiError(response.status, 'HTTP_ERROR', message);
}

function isErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'code' in data && 'message' in data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
