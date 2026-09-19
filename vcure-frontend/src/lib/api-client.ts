import { API_BASE_URL, getApiBaseUrl } from "@/constants/api";
import type { ApiErrorDto } from "@/types/auth";
import { useAuthStore } from "@/store/auth-store";

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

async function request<TResponse>(
  path: string,
  { body, skipAuth, headers, ...options }: RequestOptions = {}
): Promise<TResponse> {
  const accessToken = skipAuth ? undefined : useAuthStore.getState().accessToken;

  const baseUrl = getApiBaseUrl();
  const fullUrl = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let errorBody: ApiErrorDto | null = null;
    try {
      errorBody = (await response.json()) as ApiErrorDto;
    } catch {
      // response had no JSON body — fall through to generic message
    }
    throw new ApiError(
      errorBody?.message ?? "Something went wrong. Please try again.",
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const json = await response.json();
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return json.data as TResponse;
  }

  return json as TResponse;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" })
};
