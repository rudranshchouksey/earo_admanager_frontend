/**
 * API Service - Core Engine
 * Handles authentication headers, token refresh logic, and error normalization.
 */
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';
import { auth, getStoredSession } from './auth';

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export { auth };

export class ApiAuthError extends Error {
  readonly status = 401;
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export type ApiResult<T = unknown> = {
  data: T | null;
  error: Error | null;
  status: number;
  message: string | null;
};

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
  /**
   * When set (ms), identical requests (method + URL + body + org) within this
   * window share one network call. In-flight requests are also coalesced.
   * Omit or set 0 to always hit the network.
   */
  dedupingInterval?: number;
};

type DedupeEntry = {
  expiresAt: number;
  promise?: Promise<ApiResult<unknown>>;
  result?: ApiResult<unknown>;
};

const dedupeCache = new Map<string, DedupeEntry>();

function serializeBodyForKey(body: unknown): string {
  if (body === undefined || body === null) return '';
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    // FormData order/entries are not a stable cache key; skip body hash
    return '[FormData]';
  }
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

function buildDedupeKey(
  method: string,
  url: string,
  body: unknown,
  orgId: string | undefined,
  skipAuth: boolean,
): string {
  return [
    method,
    url,
    serializeBodyForKey(body),
    orgId ?? '',
    skipAuth ? '1' : '0',
  ].join('|');
}

function pruneDedupeCache(now = Date.now()) {
  for (const [key, entry] of dedupeCache) {
    if (!entry.promise && entry.expiresAt <= now) {
      dedupeCache.delete(key);
    }
  }
}

async function executeRequest<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<ApiResult<T>> {
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
  const orgId = {};


  const storedSession =getStoredSession();
  if(storedSession?.currentOrganizationId){
    orgId["x-org-id"] = storedSession.currentOrganizationId;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
    ...orgId,
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
    // IMPORTANT: FormData must be sent as-is and without JSON.stringify;
    // also, the browser must set the multipart boundary, so we avoid forcing Content-Type.
    body: body === undefined ? undefined : (isFormData ? (body as BodyInit) : JSON.stringify(body)),
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
    const message = responseData?.message?.message || responseData?.message || `Error ${res.status}: ${res.statusText}`;
    logger.warn('API request failed', {
      path: urlObj.pathname,
      method,
      status: res.status,
      message,
    });
    if (res.status >= 500) {
      Sentry.captureMessage(`API ${method} ${urlObj.pathname} failed: ${message}`, {
        level: 'error',
        extra: { status: res.status, path: urlObj.pathname, method },
      });
    }
    return { data: null, error: new Error(message), status: responseData.status || res.status, message: message };
  }


  return { data: responseData as T, error: null, status: responseData.status || res.status, message: responseData?.message?.message || responseData?.message || null };
}

/** Core authenticated request handler */
export async function request<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<ApiResult<T>> {
  const { dedupingInterval, method = 'GET', body, params, skipAuth = false } = config;

  if (!dedupingInterval || dedupingInterval <= 0) {
    return executeRequest<T>(path, config);
  }

  const urlObj = new URL(
    path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`,
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      urlObj.searchParams.append(key, String(value)),
    );
  }

  const orgId = getStoredSession()?.currentOrganizationId;
  const key = buildDedupeKey(method, urlObj.toString(), body, orgId, skipAuth);
  const now = Date.now();

  pruneDedupeCache(now);

  const existing = dedupeCache.get(key);
  if (existing?.promise) {
    return existing.promise as Promise<ApiResult<T>>;
  }
  if (existing?.result && existing.expiresAt > now) {
    return existing.result as ApiResult<T>;
  }

  const promise = executeRequest<T>(path, config)
    .then((result) => {
      dedupeCache.set(key, {
        expiresAt: Date.now() + dedupingInterval,
        result: result as ApiResult<unknown>,
      });
      return result;
    })
    .catch((err) => {
      // Don't cache thrown auth errors as successful results
      dedupeCache.delete(key);
      throw err;
    });

  dedupeCache.set(key, {
    expiresAt: now + dedupingInterval,
    promise: promise as Promise<ApiResult<unknown>>,
  });

  return promise;
}
