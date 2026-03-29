/**
 * API Service - Core Engine
 * Handles authentication headers, token refresh logic, and error normalization.
 */
import { auth } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export { auth };

export class ApiAuthError extends Error {
  readonly status = 401;
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const { data } = await auth.getSession();
  const session = data.session;
  if (!session?.refreshToken || !session?.user?.id) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, refreshToken: session.refreshToken }),
    });
    
    if (!res.ok) return false;
    const json = await res.json();
    const { accessToken, refreshToken } = json.issueTokens || {};
    
    if (!accessToken || !refreshToken) return false;
    await auth.updateTokensFromRefresh(accessToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function ensureValidToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = attemptTokenRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean>; // For Query Strings
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
};

/** Core authenticated request handler */
export async function request<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<{ data: T | null; error: Error | null; status: number; message: string | null }> {
  const {
    method = 'GET',
    body,
    params,
    headers: customHeaders = {},
    skipAuth = false,
    skipRefreshRetry = false,
  } = config;

  const { data: sessionData } = await auth.getSession();
  const token = sessionData.session?.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build URL with Query Parameters
  const urlObj = new URL(path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => urlObj.searchParams.append(key, String(value)));
  }

  const doFetch = () => fetch(urlObj.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let res = await doFetch();

  // Handle Token Refresh
  if (res.status === 401 && !skipAuth && !skipRefreshRetry) {
    const refreshed = await ensureValidToken();
    if (!refreshed) {
      await auth.signOut();
      throw new ApiAuthError();
    }
    
    const { data: retryData } = await auth.getSession();
    if (retryData.session?.accessToken) {
      headers['Authorization'] = `Bearer ${retryData.session.accessToken}`;
      res = await doFetch();
    }
  }

  const text = await res.text();
  let responseData: any = null;
  try {
    responseData = text ? JSON.parse(text) : null;
  } catch {
    responseData = text;
  }

  if (!res.ok) {
    const message = responseData?.message || `Error ${res.status}: ${res.statusText}`;
    return { data: null, error: new Error(message), status: responseData.status || res.status, message: message };
  }

  return { data: responseData as T, error: null, status: responseData.status || res.status, message: responseData?.message || null };
}