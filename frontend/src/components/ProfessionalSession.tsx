"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { patchProfessionalAuthProfile } from "@/lib/professional-auth.mjs";

export type ProfessionalRole = "STUDENT" | "ADVOCATE";
export type ProfessionalVerificationStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type ProfessionalProfile = {
  role: ProfessionalRole;
  verificationStatus: ProfessionalVerificationStatus;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  avatarUrl: string;
  completion: number;
  lawSchool?: string;
  degree?: string;
  studyYear?: string;
  graduationYear?: string;
  legalInterests?: string;
  schoolName?: string;
  ssc?: string;
  hsc?: string;
  ug?: string;
  pg?: string;
  experience?: string;
  stateBarCouncil?: string;
  enrolmentNumber?: string;
  yearsExperience?: string;
  practiceAreas?: string;
};

type ProfessionalSessionValue = {
  profile: ProfessionalProfile | null;
  token: string | null;
  completeProfile: (
    profile: Omit<ProfessionalProfile, "avatarUrl">,
    token: string,
    avatar?: File,
  ) => void;
  updateProfile: (updates: Partial<ProfessionalProfile>) => Promise<void>;
  signOut: () => void;
};

const ProfessionalSessionContext =
  createContext<ProfessionalSessionValue | null>(null);

export function ProfessionalSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const avatarUrl = profile?.avatarUrl;
    return () => {
      if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    };
  }, [profile?.avatarUrl]);

  function completeProfile(
    submittedProfile: Omit<ProfessionalProfile, "avatarUrl">,
    accessToken: string,
    avatar?: File,
  ) {
    setToken(accessToken);
    setProfile({
      role: submittedProfile.role,
      verificationStatus: submittedProfile.verificationStatus,
      fullName: submittedProfile.fullName,
      email: submittedProfile.email,
      phone: submittedProfile.phone,
      city: submittedProfile.city,
      completion: submittedProfile.completion,
      avatarUrl: avatar ? URL.createObjectURL(avatar) : "",
      lawSchool: submittedProfile.lawSchool,
      degree: submittedProfile.degree,
      studyYear: submittedProfile.studyYear,
      graduationYear: submittedProfile.graduationYear,
      legalInterests: submittedProfile.legalInterests,
      schoolName: submittedProfile.schoolName,
      ssc: submittedProfile.ssc,
      hsc: submittedProfile.hsc,
      ug: submittedProfile.ug,
      pg: submittedProfile.pg,
      experience: submittedProfile.experience,
      stateBarCouncil: submittedProfile.stateBarCouncil,
      enrolmentNumber: submittedProfile.enrolmentNumber,
      yearsExperience: submittedProfile.yearsExperience,
      practiceAreas: submittedProfile.practiceAreas,
    });
  }

  async function updateProfile(updates: Partial<ProfessionalProfile>) {
    if (!profile || !token) {
      throw new Error("Sign in before updating your profile.");
    }

    const account = await patchProfessionalAuthProfile({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081",
      token,
      updates: Object.entries(updates).reduce<Record<string, string>>(
        (profileUpdates, [key, value]) => {
          if (typeof value === "string") {
            profileUpdates[key] = value;
          }
          return profileUpdates;
        },
        {},
      ),
    });
    setToken(account.token);
    setProfile({
      ...profile,
      ...account.profile,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      city: account.city,
      role: account.role,
      verificationStatus: account.verificationStatus,
    });
  }

  function signOut() {
    setProfile(null);
    setToken(null);
  }

  return (
    <ProfessionalSessionContext.Provider
      value={{ profile, token, completeProfile, updateProfile, signOut }}
    >
      {children}
    </ProfessionalSessionContext.Provider>
  );
}

export function useProfessionalSession() {
  const session = useContext(ProfessionalSessionContext);
  if (!session) {
    throw new Error(
      "useProfessionalSession must be used within ProfessionalSessionProvider.",
    );
  }
  return session;
}
