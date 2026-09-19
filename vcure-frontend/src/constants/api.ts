// Global API standards locked in 05_API_CONTRACTS.md.
// Never invent endpoints. Never guess DTOs.
export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (!isLocalhost) {
      return "https://v-cure.onrender.com/api/v1";
    }
  }
  return "http://localhost:4000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout"
  },
  USER: {
    PROFILE: "/user/profile"
  },
  HEALTH_PROFILE: "/health-profile",
  LIFESTYLE: "/lifestyle",
  MEDICAL_PROFILE: "/medical-profile",
  DASHBOARD: "/dashboard"
} as const;
