/**
 * Auth Service - Centralized Session & Identity Management
 * Handles JWT storage, OTP verification, and authentication state listeners.
 */
import Cookies from "js-cookie";
import { BASE_URL, request } from "./api";
import { adsApi } from "./ads";
import { logger } from "@/lib/logger";
import { trackSignUp, trackLogin } from "@/lib/gtm";

/**
 * Plan derivation for tracking, computed from the fresh signup/login API response —
 * NOT from stored session state. `createSessionAndNotify` always hardcodes
 * `app_metadata.isPro: false` (the real value is only set later, post-redirect, via
 * `auth.setCurrentAdvertiserId`), so reading from `getStoredSession()` synchronously
 * after login/signup would always report "express" even for real Pro advertisers.
 * The raw response's `organizations[0].advertisers[0].isPro` (same shape as
 * `Advertiser.isPro` in `./advertiser`) is accurate at this point, so use that instead.
 */
function derivePlanForTracking(data: any): string {
  const org = data?.data?.organizations?.[0];
  if (org?.orgType === "AGENCY") return "agency";
  return org?.advertisers?.[0]?.isPro ? "pro" : "express";
}

export interface Organizations {
  orgId: string;
  role: string;
  name: string;
  orgType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  app_metadata?: {
    isPro: boolean;
    userState: 'new' | 'existing';
    isAgency: boolean;
    status: string;
    mfaEnabled?: boolean;
    mfaSkipUntil?: string;
    organizations?: Organizations[];
    role: "SUPERADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
    isSuperAdmin?: boolean;
  };
}

export interface AuthSession {
  user: AuthUser;
  currentOrganizationId: string;
  currentAdvertiserId: string;
  accessToken: string;
  refreshToken?: string;
}

export const STORAGE_KEY = 'nextads_auth_session';
type AuthListener = (event: string, session: AuthSession | null) => void;
const listeners = new Set<AuthListener>();

// --- Internal Helpers ---

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    
    return {
      user,
      currentOrganizationId: user.currentOrganizationId,
      currentAdvertiserId: user.currentAdvertiserId,
      accessToken: Cookies.get("accessToken") || '',
      refreshToken: Cookies.get("refreshToken")
    };
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    Cookies.remove("accessToken", { path: '/' });
    Cookies.remove("refreshToken", { path: '/' });
    return;
  }

  // Access Token (Short-lived, usually 15m - 1h)
  Cookies.set("accessToken", session.accessToken, {
    expires: 1/96, // 15 minutes
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
    path: '/'
  });

  // Refresh Token (Long-lived, 7+ days)
  if (session.refreshToken) {
    Cookies.set("refreshToken", session.refreshToken, {
      expires: 7,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      path: '/'
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session.user, currentOrganizationId: session.currentOrganizationId, currentAdvertiserId: session.currentAdvertiserId }));

}
export function createSessionAndNotify(data: any) {
  const currentOrganizationId = data.data.organizations[0].orgId;
  const orgType = data.data.organizations[0].orgType;

  const role = data.data.organizations ? data.data.organizations[0].role : 'VIEWER';

  const session: AuthSession = {
    user: {
      id: data.data.id,
      email: data.data.email,
      app_metadata: {
        isPro: false,
        userState: 'existing',
        isAgency:  orgType === 'AGENCY',
        status: data.data.status,
        mfaEnabled: data.data.mfaEnabled,
        mfaSkipUntil: data.data.mfaSkipUntil,
        organizations: data.data.organizations ?? [],
        isSuperAdmin: data.data.isSuperAdmin,
        role
      }
    },
    currentOrganizationId: currentOrganizationId,
    currentAdvertiserId: "",
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken
  };

  setStoredSession(session);
  notify('SIGNED_IN', session);
}

const notify = (event: string, session: AuthSession | null) => 
  listeners.forEach(cb => cb(event, session));


async function downloadAndUploadAudio(audioUrl: string, organizationId: string, accessToken: string) {
  try {
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio (${audioResponse.status})`);
    }

    const audioBlob = await audioResponse.blob();
    if (audioBlob.size === 0) {
      throw new Error('Downloaded audio file is empty');
    }
    if (audioBlob.size > 5 * 1024 * 1024) {
      throw new Error(`Audio file is too large (${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB)`);
    }

    const filename = audioUrl.split('/').pop()?.split('?')[0] || 'audio.mp3';
    const file = new File([audioBlob], filename, { type: audioBlob.type || 'audio/mpeg' });

    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/creatives/commonFileUpload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-org-id': organizationId,
      },
    });

    const result = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok) {
      throw new Error(result?.message || `Upload failed (${uploadResponse.status})`);
    }

    return result;
  } catch (error) {
    logger.captureException(error, { context: 'Error:' });
    return null;
  }
}

export const handleLandingPageAudioAdDownload = async (jobId: string, recommendedVersion: string, advertiserId: string, organizationId: string, accessToken: string) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_APP_URL}/api/creative/v2/status?job_id=${encodeURIComponent(jobId)}`,
      { method: "GET" },
    );
    const json = await res.json().catch(() => ({}));

    if (json && json.recommendations && json.recommendations.length > 0) {
      const recommendation = await fetch(
        `${import.meta.env.VITE_APP_URL}/api/creative/v2/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            composition_id:
              json.recommendations[recommendedVersion].composition_id,
            ad_script: json.recommendations[recommendedVersion].ad_script,
          }),
        },
      );

      const recommendationJson = await recommendation
        .json()
        .catch(() => ({}));

      logger.info("recommendationJson ", { value: recommendationJson });
      

      if (
        recommendationJson &&
        recommendationJson.result &&
        recommendationJson.result.audio_ad &&
        recommendationJson.result.audio_ad.audio_url
      ) {

        

        const fileuploadResult = await downloadAndUploadAudio(recommendationJson.result.audio_ad.audio_url, organizationId, accessToken);

        
        
        
        const result = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/creatives/uploadAudioAd`, {
          method: 'POST',
          body: JSON.stringify({
            adName: 'Your Audio Ad',
            advertiserId: advertiserId,
            fileUrl: fileuploadResult?.data?.url || '',
            duration: parseInt(fileuploadResult?.data?.duration || '0'),
            campaignGoal: 'BRAND_AWARENESS',
          }),
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-org-id': organizationId,
          },
        });
        const resultJson = await result.json();
        logger.info("resultJson ", { value: resultJson });
      } else {
        logger.info("No audio url found");
      }

      //setAudioUrl(json?.data?.result?.delivery?.uri);
      //setStatus("ready");
    }
  } catch {}
}

// --- Auth Exports ---

export const auth = {
  /** Initialize session on app load */
  initialize: () => {
    const session = getStoredSession();
    if (session?.accessToken) {
      notify('INITIALIZED', session);
      return session;
    }
    return null;
  },

  getSession: async () => ({ data: { session: getStoredSession() } }),

  setCurrentOrganizationId: (organizationId: string) => {
    const session = getStoredSession();
    if (!session) return;
    session.currentOrganizationId = organizationId;
    setStoredSession(session);
    notify('ORGANIZATION_CHANGED', session);
  },

  setOrganizationType: (organizationType: string) => {
    const session = getStoredSession();
    if (!session) return;
    if(organizationType === "AGENCY") {
      session.user.app_metadata!.isAgency = true;
      session.user.app_metadata!.isPro = true;
    } else {
      session.user.app_metadata!.isAgency = false;
      session.user.app_metadata!.isPro = false;
    }
    setStoredSession(session);
    notify('USER_UPDATED', session);
  },

  setCurrentAdvertiserId: (advertiserId: string, isPro: boolean = false) => {

    const session = getStoredSession();
    if (!session) return;
    session.currentAdvertiserId = advertiserId;
    session.user.app_metadata!.isPro = isPro;

    setStoredSession(session);
    notify('ADVERTISER_CHANGED', session);
  },

  userUpgradedToAgency: () => {
    const session = getStoredSession();
    if (!session) return;
    session.user.app_metadata!.isAgency = true;
    setStoredSession(session);
    notify('USER_UPDATED', session);
  },

  /** Standard Login */
  signInWithPassword: async (email: string, password: string) => {

    const { data, error, status, message } = await request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password: password.trim() },
      skipAuth: true
    });

    if (error || !data?.tokens) return { data, error, status, message };

    createSessionAndNotify(data);
    trackLogin({ method: "email", plan: derivePlanForTracking(data), userId: data?.data?.id, orgId: data?.data?.organizations?.[0]?.orgId });
    return { data, error: null, status, message };
  },

  /** Google OAuth */
  signInWithGoogle: async (token: string, jobId: string, recommendedVersion: string) => {
    const { data, error, status, message } = await request<any>('/api/v1/auth/google', {
      method: 'POST',
      body: { token },
      skipAuth: true
    });

    logger.info("signInWithGoogle", { data, error, status, message });

    if (error || status !== 200 || !data?.tokens) return { data: data?.data, error, status, message };


    if(jobId && recommendedVersion && data.isNewAccount){
      const advertiserId = data?.data?.organizations[0]?.advertisers[0]?.id;
      const organizationId = data?.data?.organizations[0]?.orgId;
      logger.info("advertiserId ", { value: advertiserId });
      handleLandingPageAudioAdDownload(jobId, recommendedVersion, advertiserId, organizationId, data.tokens.accessToken);
    }

    createSessionAndNotify(data);
    const trackParams = {
      plan: derivePlanForTracking(data),
      userId: data?.data?.id,
      orgId: data?.data?.organizations?.[0]?.orgId,
    };
    if (data.isNewAccount) {
      trackSignUp({ method: "google", ...trackParams });
    } else {
      trackLogin({ method: "google", ...trackParams });
    }
    return { data, error: null, status: 200, message };
  },

  /** Registration */
  signUpWithPassword: async (params: {
    email: string;
    password: string;
    confirmPassword: string;
    jobId: string;
    recommendedVersion: string;
  }) => {
    const { data, error, status, message } = await request<any>('/api/v1/auth/signup', {
      method: 'POST',
      body: params,
      skipAuth: true
    });

    if (error || !data?.tokens) return { data: null, error, status, message };   


    if(params.jobId && data?.data?.organizations[0]?.advertisers && data?.data?.organizations[0]?.advertisers?.length > 0){
      const advertiserId = data?.data?.organizations[0]?.advertisers[0]?.id;
      const organizationId = data?.data?.organizations[0]?.orgId;

      handleLandingPageAudioAdDownload(params.jobId, params.recommendedVersion, advertiserId, organizationId, data.tokens.accessToken);
    }

    createSessionAndNotify(data);
    trackSignUp({
      method: "email",
      plan: derivePlanForTracking(data),
      userId: data?.data?.id,
      orgId: data?.data?.organizations?.[0]?.orgId,
    });

    return { data, error: null, status, message };
  },

  /** OTP & Verification Flows */
  verifyEmailOtp: async (email: string, otp: string) => {

    const { error, status, message } = await request('/api/v1/auth/verifyOtp', {
      method: 'POST',
      body: { email, otp }
    });

    if (error || status !== 200) return { error, status, message };

    const session = getStoredSession();
    if (session) {
      session.user.app_metadata!.status = 'ACTIVE';
      setStoredSession(session);
      notify('USER_UPDATED', session);
    }
    return { error: null, status, message };
  },


  sendEmailVerificationOtp2fa: (userId: string, mfaToken: string) => 
    request(`/api/v1/auth/sendEmailOtp`, { body: { userId, mfaToken }, method: "POST" }),


  verifyEmailVerificationOtp2fa: async (userId: string, mfaToken: string, otp: string) => {

    const { error, status, message, data } = await request<any>(`/api/v1/auth/verifyEmailOtp`, { body: { userId, mfaToken, otp }, method: "POST" });
    if (error || status !== 200 || !data.tokens) return { error, status, message};
    const currentOrganizationId = data.data.organizations[0].orgId;

    const session: AuthSession = {
      user: {
        id: userId,
        email: data.email,
        app_metadata: {
          isPro: false,
          userState: 'new',
          isAgency: data.data.organizations[0].orgType === "AGENCY",
          status: data.data.status,
          role: data.data.role,
          isSuperAdmin: data.data.isSuperAdmin,
        }
      },
      currentOrganizationId: currentOrganizationId,
      currentAdvertiserId: "",
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken
    };

    setStoredSession(session);
    notify('SIGNED_IN', session);
    trackLogin({ method: "email", plan: derivePlanForTracking(data), userId, orgId: currentOrganizationId });
    return { data: { session }, error: null, status, message };

  },

  verifyEmailWithToken: async (token: string) => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/verifyEmail?token=${token}`, {
      method: 'GET',
    });
    const data = await response.json();
    return { data, error: null, status: response.status, message: data.message };
  },

  claimShopifyAccountVerify: (token: string) =>
    request('/api/v1/auth/claimShopifyAccount/verify', {
      method: 'POST',
      body: { token },
      skipAuth: true,
    }),

  resendOtp: (email: string) => 
    request(`/api/v1/auth/resendVerifyEmail`, { params: { email } }),

  /** Password Recovery */
  forgotPassword: (email: string) => 
    request('/api/v1/auth/forgotPassword', { method: 'POST', body: { email }, skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    request('/api/v1/auth/resetPassword', { method: 'POST', body: { token, password }, skipAuth: true }),

  /** Token Refresh Hook (Called by api.ts) */
  updateTokensFromRefresh: async (accessToken: string, refreshToken?: string) => {
    const session = getStoredSession();
    if (!session) return;
    const updated = { ...session, accessToken, refreshToken };
    setStoredSession(updated);
    notify('TOKEN_REFRESHED', updated);
  },

  signOut: async () => {
    setStoredSession(null);
    notify('SIGNED_OUT', null);
  },

  onAuthStateChange: (callback: AuthListener) => {
    listeners.add(callback);
    return { data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    }
   };
  }
};