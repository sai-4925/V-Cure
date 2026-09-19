import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile-service";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfileFormValues } from "@/lib/validation/profile";
import type {
  HealthProfileFormValues,
  LifestyleFormValues,
  GoalsFormValues
} from "@/lib/validation/onboarding";

export function getProfileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function useUserProfile() {
  return useQuery({ queryKey: ["profile", "user"], queryFn: profileService.getUserProfile });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: (payload: UserProfileFormValues) => profileService.updateUserProfile(payload),
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile", "user"] });
      const newFullName = variables.fullName || updatedData?.fullName;
      if (authUser && accessToken && refreshToken && newFullName) {
        setSession(
          { ...authUser, fullName: newFullName },
          accessToken,
          refreshToken
        );
      }
    }
  });
}

export function useHealthProfile() {
  return useQuery({
    queryKey: ["profile", "health"],
    queryFn: profileService.getHealthProfile
  });
}

export function useUpdateHealthProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HealthProfileFormValues) =>
      profileService.updateHealthProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "health"] });
      queryClient.invalidateQueries({ queryKey: ["profile", "completion"] });
    }
  });
}

export function useLifestyleProfile() {
  return useQuery({
    queryKey: ["profile", "lifestyle"],
    queryFn: profileService.getLifestyle
  });
}

export function useUpdateLifestyleProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LifestyleFormValues) => profileService.updateLifestyle(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", "lifestyle"] })
  });
}

export function useHealthGoals() {
  return useQuery({ queryKey: ["profile", "goals"], queryFn: profileService.getGoals });
}

export function useUpdateHealthGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoalsFormValues) => profileService.updateGoals(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", "goals"] })
  });
}

export function useProfileCompletion() {
  return useQuery({
    queryKey: ["profile", "completion"],
    queryFn: profileService.getCompletion
  });
}
