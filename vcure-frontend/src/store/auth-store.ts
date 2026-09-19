import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserDto } from "@/types/auth";
import { useOnboardingStore } from "./onboarding-store";

interface AuthState {
  user: AuthUserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: AuthUserDto, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
        if (user?.id) {
          useOnboardingStore.getState().initForUser(user.id, user.fullName);
        }
      },
      clearSession: () => {
        useOnboardingStore.getState().clearForLogout();
        set({ user: null, accessToken: null, refreshToken: null });
      }
    }),
    {
      name: "vcure-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user
      })
    }
  )
);
