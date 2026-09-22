/** Every endpoint responds with one of these two shapes — never a bare object. */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponseBody<T> = ApiSuccess<T> | ApiErrorBody;
