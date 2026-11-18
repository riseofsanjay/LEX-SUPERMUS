export type ProfessionalAuthAction = "register" | "login";

export type ProfessionalAuthResponse = {
  id: string;
  email: string;
  role: "STUDENT" | "ADVOCATE";
  verificationStatus: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "REJECTED";
  token: string;
  expiresIn: number;
  fullName: string;
  phone: string;
  city: string;
  profile: Record<string, string>;
};

export function postProfessionalAuth(options: {
  baseUrl: string;
  action: ProfessionalAuthAction;
  payload: Record<string, unknown>;
  fetcher?: typeof fetch;
}): Promise<ProfessionalAuthResponse>;

export function getProfessionalAuthProfile(options: {
  baseUrl: string;
  token: string;
  fetcher?: typeof fetch;
}): Promise<ProfessionalAuthResponse>;

export function patchProfessionalAuthProfile(options: {
  baseUrl: string;
  token: string;
  updates: Record<string, string>;
  fetcher?: typeof fetch;
}): Promise<ProfessionalAuthResponse>;
