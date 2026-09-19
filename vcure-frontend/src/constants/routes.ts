// Routing structure locked in 06_FRONTEND_ARCHITECTURE.md Part 6A #4.
// Never invent new top-level routes without an architecture update.
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  MEDICAL: "/medical",
  REPORTS: "/reports",
  MEALS: "/meals",
  RECIPES: "/recipes",
  EDUCATION: "/education",
  TRACKING: "/tracking",
  PROGRESS: "/progress",
  SHOPPING: "/shopping",
  AI_COACH: "/ai",
  SETTINGS: "/settings",
  NOTIFICATIONS: "/notifications",
  PREMIUM: "/premium",
  INSURANCE: "/insurance",
  ADMIN: "/admin"
} as const;
