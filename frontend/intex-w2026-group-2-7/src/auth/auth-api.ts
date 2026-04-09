import type { AuthTokens, CurrentUser } from "@/auth/auth-types";

const LOCAL_API_BASE_URL = "https://localhost:7229";
const PROD_API_BASE_URL =
  "https://intex-w2026-group-2-7-h0fwdqczb3hvb2f9.centralus-01.azurewebsites.net";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

export type ExternalAuthProvider = {
  name: string;
  displayName: string;
  startUrl: string;
};

export const resolveApiBaseUrl = (): string => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return origin;
    }

    if (hostname.endsWith("azurewebsites.net")) {
      return origin;
    }
  }

  return PROD_API_BASE_URL;
};

export const buildApiUrl = (apiBaseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, `${apiBaseUrl}/`).toString();
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    if (typeof error.details === "object" && error.details !== null && "detail" in error.details) {
      const detail = (error.details as { detail?: unknown }).detail;
      if (typeof detail === "string" && detail.trim().length > 0) {
        return detail;
      }
    }

    if (typeof error.details === "object" && error.details !== null && "errors" in error.details) {
      const errors = (error.details as { errors?: Record<string, string[] | undefined> }).errors;
      if (errors && typeof errors === "object") {
        const lines = Object.entries(errors).flatMap(([key, messages]) =>
          (messages ?? []).map((msg) => `${key}: ${msg}`),
        );
        if (lines.length > 0) {
          return lines.join(" ");
        }
      }
    }

    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

export async function requestJson<T>(
  apiBaseUrl: string,
  path: string,
  init: JsonRequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | null | undefined = init.body as BodyInit | null | undefined;
  const shouldSerializeBody =
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    typeof body !== "string";

  if (shouldSerializeBody) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildApiUrl(apiBaseUrl, path), {
    ...init,
    headers,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  const parsedBody =
    rawBody.length > 0 && response.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(rawBody)
      : rawBody;

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "title" in parsedBody &&
      typeof (parsedBody as { title?: unknown }).title === "string"
        ? ((parsedBody as { title: string }).title || `Request failed with ${response.status}`)
        : `Request failed with ${response.status}`;

    throw new ApiError(message, response.status, parsedBody);
  }

  return parsedBody as T;
}

export const registerRequest = (apiBaseUrl: string, email: string, password: string) =>
  requestJson<void>(apiBaseUrl, "/auth/register", {
    method: "POST",
    body: { email, password },
  });

export const forgotPasswordRequest = (apiBaseUrl: string, email: string) =>
  requestJson<void>(apiBaseUrl, "/auth/forgotPassword", {
    method: "POST",
    body: { email },
  });

const encodeResetCode = (code: string): string => {
  const utf8Bytes = new TextEncoder().encode(code);
  let binary = "";

  utf8Bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const resetPasswordRequest = (
  apiBaseUrl: string,
  email: string,
  resetCode: string,
  newPassword: string,
) =>
  requestJson<void>(apiBaseUrl, "/auth/resetPassword", {
    method: "POST",
    body: {
      email,
      resetCode: encodeResetCode(resetCode),
      newPassword,
    },
  });

export const loginRequest = (apiBaseUrl: string, email: string, password: string) =>
  requestJson<AuthTokens>(apiBaseUrl, "/auth/login?useCookies=false", {
    method: "POST",
    body: { email, password },
  });

export const getExternalAuthProvidersRequest = (apiBaseUrl: string) =>
  requestJson<ExternalAuthProvider[]>(apiBaseUrl, "/auth/external/providers");

export const exchangeExternalAuthCodeRequest = (apiBaseUrl: string, code: string) =>
  requestJson<AuthTokens>(apiBaseUrl, "/auth/external/exchange", {
    method: "POST",
    body: { code },
  });

export const refreshRequest = (apiBaseUrl: string, refreshToken: string) =>
  requestJson<AuthTokens>(apiBaseUrl, "/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });

export const logoutRequest = (apiBaseUrl: string, accessToken: string) =>
  requestJson<void>(
    apiBaseUrl,
    "/auth/logout",
    {
      method: "POST",
    },
    accessToken,
  );

export const getCurrentUserRequest = (apiBaseUrl: string, accessToken: string) =>
  requestJson<CurrentUser>(apiBaseUrl, "/auth/me", {}, accessToken);
