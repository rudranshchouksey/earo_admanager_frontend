import { request } from "./api";

export interface TeamUser {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  role: string;
  orgId: string;
  AdvertiserAccounts?: string;
  advertiserId: string | string[];
}

export interface TeamUserResponse {
  status: string;
  message: string;
  data: TeamUser[];
}

export const teamApi = {
  getTeamUsers: (organizationId: string) =>
    request<TeamUserResponse>("/api/v1/users/getUsers", { method: "POST", body: { orgId: organizationId } }),
  createTeamUser: (user: TeamUser, organizationId: string) =>
    request<TeamUserResponse>("/api/v1/users/createUser", {
      method: "POST",
      body: { ...user, orgId: organizationId, advertiserIds: user.advertiserId ? typeof user.advertiserId === "string" ? user.advertiserId.split(",") : user.advertiserId : [] , advertiserAccounts: user.AdvertiserAccounts || "SPECIFIC"},
    }),
  updateTeamUser: (user: TeamUser, organizationId: string) =>
    request<TeamUserResponse>("/api/v1/users/updateUser", {
      method: "POST",
      body: { ...user, orgId: organizationId, userId: user.id, advertiserIds: user.advertiserId ? typeof user.advertiserId === "string" ? user.advertiserId.split(",") : user.advertiserId : [] , advertiserAccounts: user.AdvertiserAccounts || "SPECIFIC"},
    }),
  deleteTeamUser: (userId: string, organizationId: string) =>
    request<TeamUserResponse>("/api/v1/users/deleteUser", {
      method: "POST",
      body: { userId, orgId: organizationId },
    }),
  inviteTeamUser: (user: TeamUser) =>
    request<TeamUserResponse>("/api/v1/users/inviteUser", {
      method: "POST",
      body: user,
    }),
  resetPassword: (userId: string) =>
    request<TeamUserResponse>("/api/v1/auth/resetPasswordForUser", {
      method: "POST",
      body: { userId },
    }),
  sendInvite: (userId: string) =>
    request<TeamUserResponse>("/api/v1/users/sendInvite", {
      method: "POST",
      body: { userId },
    }),
  getTeamUser: (userId: string) =>
    request<TeamUserResponse>("/api/v1/users/getUser", {
      method: "GET",
      body: { userId },
    }),
  resendInvite: (userId: string, advertiserId: string) =>
    request<TeamUserResponse>("/api/v1/users/resendInvite", {
      method: "POST",
      body: { userId, advertiserId },
    }),
};
