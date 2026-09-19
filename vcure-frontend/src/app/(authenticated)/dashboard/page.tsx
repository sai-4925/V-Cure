"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, BookOpen, ShoppingBag, BarChart3, Plus, Minus, Flame, Droplets, ShieldCheck, ChevronRight, Menu, X, LogOut, UtensilsCrossed, FileText, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useMealPlannerStore } from "@/store/meal-planner-store";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth-service";
import { useTranslation } from "@/hooks/use-translation";
import {
  getSafeMealsForUser,
  ALL_CATALOG_MEALS,
  type MealRecommendationItem
} from "@/lib/meal-adapter/personalized-recommendation-engine";
import { calculateHealthScore } from "@/lib/health-score";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VCureWordmarkLogo } from "@/components/ui/vcure-logo";
import { ROUTES } from "@/constants/routes";
import type { MealSlot } from "@/types/meals";

import { getGreetingName } from "@/lib/cn";
import { CompactHealthMonitoringCard } from "@/components/dashboard/compact-health-monitoring-card";
import { RecommendedHealthDevicesSection } from "@/components/dashboard/recommended-devices-section";
import { Pill } from "lucide-react";

export default function DashboardPage() {
  const { data } = useDashboardSummary();
  const draft = useOnboardingStore((state) => state.draft);
  const selectedPrimaryMeals = useMealPlannerStore((state) => state.selectedPrimaryMeals);
  const authUser = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed with local clear on network error
    }
    clearSession();
    router.replace(ROUTES.LOGIN);
  };

  const rawFullName = authUser?.fullName && authUser.fullName.trim() !== ""
    ? authUser.fullName
    : data?.fullName && data.fullName.trim() !== ""
    ? data.fullName
    : draft.personalInfo?.fullName && draft.personalInfo.fullName.trim() !== ""
    ? draft.personalInfo.fullName
    : null;

  const userName = getGreetingName(rawFullName);
  const userAvatar = authUser?.avatarUrl || (draft.personalInfo as any)?.avatarUrl || null;

  // Calculate dynamic personalized wellness health score
  const healthScore = calculateHealthScore(draft);

  // Generate personalized active meals for the 4 slots
  const safeMeals = getSafeMealsForUser(draft);
  const slots: MealSlot[] = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

  const activeDailyMeals: MealRecommendationItem[] = slots.map((slot) => {
    const savedId = selectedPrimaryMeals[slot];
    const matchSaved = safeMeals.find((m) => m.type === slot && m.id === savedId);
    if (matchSaved) return matchSaved;

    const matchSafeFirst = safeMeals.find((m) => m.type === slot);
    if (matchSafeFirst) return matchSafeFirst;

    return ALL_CATALOG_MEALS.find((m) => m.type === slot)!;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      {/* Top Green Hero Banner & Health Score Display */}
      <div className="relative rounded-b-[36px] bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-700 px-6 pt-5 pb-6 text-white shadow-md">
        {/* Top Row: 3-Column Grid (Menu | V-Cure Logo | Profile Avatar) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Hamburger Menu Button */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/15 shadow-xs cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Center: Official V-Cure Wordmark Logo */}
          <div className="flex items-center justify-center">
            <VCureWordmarkLogo variant="light" className="h-7 w-auto" />
          </div>

          {/* Right: Circular Profile Picture / Avatar */}
          <div className="flex items-center justify-end">
            <Link
              href="/profile"
              className="flex items-center justify-center rounded-full shadow-md transition-all shrink-0 hover:scale-105"
              aria-label="Profile"
            >
              <UserAvatar src={userAvatar} name={userName} size="sm" />
            </Link>
          </div>
        </div>

        {/* Greeting Row Below Top Bar */}
        <div className="mt-4">
          <p className="text-xs font-medium text-emerald-200">{t.welcomeBack},</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {userName}
          </h1>
        </div>

        {/* Dynamic Centered Health Score Ring */}
        <div className="mt-5 flex flex-col items-center justify-center text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-400/40 bg-emerald-800/60 shadow-[0_0_20px_rgba(52,211,153,0.2)] backdrop-blur-xs">
            <div className="text-center">
              <span className="text-3xl font-black tracking-tight text-white">{healthScore}</span>
              <p className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-wider mt-0.5">
                {t.healthScoreLabel}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-100/80 tracking-wide">
            {t.healthScoreSubtitle}
          </p>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-4/5 max-w-xs bg-white h-full p-5 pb-24 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <VCureWordmarkLogo variant="dark" className="h-6 w-auto" />
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-2 mb-2">
                  V-CURE NAVIGATION
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50"
                >
                  <BarChart3 className="h-4 w-4" />
                  {t.navDashboard}
                </Link>
                <Link
                  href="/meals"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                  {t.todaysMealPlanTitle}
                </Link>
                <Link
                  href="/ai"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  {t.navCoach}
                </Link>

                {/* Requirement 2: Medication Insights Directly Under AI Coach */}
                <Link
                  href="/medications"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <Pill className="h-4 w-4 text-emerald-600" />
                  Medication Insights
                </Link>

                <Link
                  href="/education"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  {t.educationTitle}
                </Link>
                <Link
                  href="/shopping"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  {t.groceryListTitle}
                </Link>
                <Link
                  href="/progress"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  {t.progressTitle}
                </Link>
                <Link
                  href="/reports"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                  {t.medicalReports}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <UserIcon className="h-4 w-4 text-emerald-600" />
                  {t.profileTitle}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <SettingsIcon className="h-4 w-4 text-emerald-600" />
                  {t.navSettings}
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-xs font-bold text-red-600 hover:bg-red-100 transition-all border border-red-100 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {t.logoutButton}
              </button>
              <p className="text-[10px] font-semibold text-gray-400 text-center">V-Cure Healthcare v1.0</p>
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
        </div>
      ) : null}

      <Container className="max-w-md px-4 mt-5 space-y-6">
        {/* Floating Macro Cards Row: Requirement 1 & 6 - Clickable Compact Summary Cards Pair */}
        <div className="grid grid-cols-2 gap-3">
          {/* Compact Health Monitoring Card (Left) */}
          <CompactHealthMonitoringCard />

          {/* Daily Calories Summary Card (Right) - Clickable, navigates to /nutrition */}
          <Link
            href="/nutrition"
            className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md flex flex-col justify-between h-[126px] cursor-pointer hover:border-emerald-300 hover:shadow-lg transition-all group relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs">
                <Flame className="h-4 w-4 fill-orange-500" />
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-800 transition-colors">
                  {t.caloriesLabel}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="my-1">
              <span className="text-xl font-black text-gray-900">1230</span>
              <span className="text-[10px] font-bold text-gray-400 ml-1">kcal</span>
            </div>

            <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">P 68g</span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">C 128g</span>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">F 41g</span>
            </div>
          </Link>
        </div>

        {/* Quick Action Buttons (Health Reports, Education, Grocery, Insurance) - Requirement 4: Perfect Alignment 4x1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Quick Actions
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Link
              href="/reports"
              className="flex h-24 w-full flex-col items-center justify-between rounded-2xl bg-white p-2.5 text-center shadow-xs border border-emerald-100/80 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-800 text-center leading-tight h-[28px] flex items-center justify-center">
                Health Reports
              </span>
            </Link>

            <Link
              href="/education"
              className="flex h-24 w-full flex-col items-center justify-between rounded-2xl bg-white p-2.5 text-center shadow-xs border border-emerald-100/80 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-800 text-center leading-tight h-[28px] flex items-center justify-center">
                Education
              </span>
            </Link>

            <Link
              href="/shopping"
              className="flex h-24 w-full flex-col items-center justify-between rounded-2xl bg-white p-2.5 text-center shadow-xs border border-emerald-100/80 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-800 text-center leading-tight h-[28px] flex items-center justify-center">
                Grocery & Shopping
              </span>
            </Link>

            <Link
              href="/insurance"
              className="flex h-24 w-full flex-col items-center justify-between rounded-2xl bg-white p-2.5 text-center shadow-xs border border-emerald-100/80 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-800 text-center leading-tight h-[28px] flex items-center justify-center">
                Insurance
              </span>
            </Link>
          </div>
        </div>

        {/* Requirement 5: Personalized Setup Badge */}
        {draft.diabetesCategory?.category ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{t.onboardingTitle}: {draft.diabetesCategory.category.replace("_", " ")}</span>
            </div>
            <Link href="/onboarding" className="text-[11px] font-bold text-emerald-700 hover:underline">
              {t.edit}
            </Link>
          </div>
        ) : null}

        {/* Today's Meals Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{t.todaysMealPlanTitle}</h2>
            <Link href={ROUTES.MEALS} className="text-xs font-bold text-emerald-600 hover:underline">
              {t.selectAlternative}
            </Link>
          </div>

          <div className="space-y-3">
            {activeDailyMeals.map((meal, idx) => (
              <Link
                key={idx}
                href={`/meals/${meal.id}`}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-xs hover:border-emerald-200 transition-all block"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={meal.img}
                    alt={meal.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      {meal.type}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{meal.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{meal.calories}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{meal.protein}</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">{meal.giTag}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Requirement 3: Recommended Health Devices (BELOW Today's Meal Plan) */}
        <RecommendedHealthDevicesSection />
      </Container>
    </div>
  );
}


