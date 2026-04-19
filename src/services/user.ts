import { request } from "./api";


export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  newsletterOpt: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  language: string;
  affiliateCode: string;
  role: string;
  orgId: string;
  status: string;
  onboardingComplete: boolean;
}

export interface UserProfileResponse {
    status: string;
    message: string;
    data?: UserProfile;
}

export interface Setup2faResponse {
  status: string;
  message: string;
  data: {
    qrCode: string;
    mfaToken: string;
  };
}

export interface Verify2faResponse {
  status: string;
  message: string;
  data: {
    verified: boolean;
  };
}

export const userApi = {
  getUserProfile: () => request<UserProfileResponse>('/api/v1/users/getProfile', { method: "GET" }),

  updateUserProfile: (profile: Partial<UserProfile>) => request<UserProfile>('/api/v1/users/updateUser', { method: 'POST', body: profile }),

  updatePersonalInfo: (userId: string, profile: Partial<UserProfile>) => request<UserProfile>(`/api/v1/users/updatePersonalInfo`, { method: 'POST', body: {...profile, userId} }),

  changePassword: (newPassword: string) => request<UserProfile>('/api/v1/users/updatePassword', { method: 'POST', body: { password: newPassword } }),

  setup2fa: (userId: string) => request<Setup2faResponse>('/api/v1/auth/2fa/setup', { method: 'POST', body: { userId } }),

  verify2fa: (userId: string, code: string, mfaToken: string) => request<Verify2faResponse>('/api/v1/auth/2fa/verify', { method: 'POST', body: { userId, token:code, mfaToken  } }),

};