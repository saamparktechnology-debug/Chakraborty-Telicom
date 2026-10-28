import { useAuthStore } from '../store/useAuthStore';

export class MobileApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, MobileApiError.prototype);
  }
}

export async function mobileApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, apiBaseUrl, clearSession } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${normalizedEndpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new MobileApiError(
      0,
      'NETWORK_ERROR',
      `Cannot reach backend at ${apiBaseUrl}. Ensure your Express server is running on port 4000 and that the API URL matches your PC's Wi-Fi IP.`
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && normalizedEndpoint !== '/auth/login') {
    await clearSession();
    throw new MobileApiError(
      401,
      payload.error || 'UNAUTHORIZED',
      payload.message || 'Session expired. Please sign in again.'
    );
  }

  if (!response.ok) {
    let detailedMessage = payload.message || `Request failed (${response.status})`;
    if (Array.isArray(payload.details) && payload.details.length > 0) {
      const detailStr = payload.details
        .map((d: { path?: string; message?: string }) =>
          d.path ? `${d.path}: ${d.message}` : d.message
        )
        .join(', ');
      detailedMessage = `${detailedMessage} (${detailStr})`;
    }
    throw new MobileApiError(
      response.status,
      payload.error || 'API_ERROR',
      detailedMessage
    );
  }

  return payload as T;
}

export const apiClient = {
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const data = await mobileApiRequest<T>(endpoint, { method: 'GET' });
    return { data };
  },
  async post<T = any>(endpoint: string, body?: unknown): Promise<{ data: T }> {
    const data = await mobileApiRequest<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  async put<T = any>(endpoint: string, body?: unknown): Promise<{ data: T }> {
    const data = await mobileApiRequest<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  async patch<T = any>(endpoint: string, body?: unknown): Promise<{ data: T }> {
    const data = await mobileApiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof MobileApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function toSafeNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function formatInr(amount: string | number | undefined | null): string {
  const num = toSafeNumber(amount, 0);
  const neg = num < 0;
  const abs = Math.abs(num);
  return `${neg ? '-₹' : '₹'}${abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
