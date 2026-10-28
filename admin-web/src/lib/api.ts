export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const PUBLIC_AUTH_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
]);

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("amul_access_token")
      : null;

  const isPublicAuthRoute = PUBLIC_AUTH_ENDPOINTS.has(endpoint);

  // Block protected API calls immediately if not logged in
  if (!token && !isPublicAuthRoute) {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    throw new ApiClientError(
      401,
      "UNAUTHORIZED",
      "Authentication required. Please sign in.",
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && !isPublicAuthRoute) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("amul_access_token");
      window.localStorage.removeItem("amul_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new ApiClientError(
      401,
      payload.error || "UNAUTHORIZED",
      payload.message || "Session expired or unauthenticated. Please sign in.",
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      payload.error || "API_ERROR",
      payload.message || `Backend request failed (${response.status})`,
    );
  }

  return payload as T;
}

export const apiFetch = apiRequest;
