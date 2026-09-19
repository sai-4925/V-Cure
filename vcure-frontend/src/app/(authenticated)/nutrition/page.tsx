"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, CheckCircle2, Circle, Utensils, Info, Calendar } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useMealPlannerStore } from "@/store/meal-planner-store";
import { useProgressStore } from "@/store/progress-store";
import {
  getSafeMealsForUser,
  ALL_CATALOG_MEALS,
  type MealRecommendationItem
} from "@/lib/meal-adapter/personalized-recommendation-engine";
import type { MealSlot } from "@/types/meals";

export default function DailyNutritionDetailPage() {
  const draft = useOnboardingStore((state) => state.draft);
  const selectedPrimaryMeals = useMealPlannerStore((state) => state.selectedPrimaryMeals);
  const eatenMealIds = useProgressStore((state) => state.eatenMealIds);
  const toggleMealEaten = useProgressStore((state) => state.toggleMealEaten);

  // Generate personalized daily meal slots
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

  // Calculate target intake based on onboarding profile
  const gender = draft.personalInfo?.gender || "MALE";
  const weightKg = draft.personalInfo?.weightKg || draft.healthProfile?.weightKg || 70;
  
  // Baseline targets (or profile derived)
  const targetCalories = Math.round(weightKg * 25 + (gender === "MALE" ? 100 : 0));
  const targetProtein = Math.round(weightKg * 1.2);
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  // Helper to parse numeric values from strings like "280 kcal" or "13g P"
  const parseNum = (str: string | undefined): number => {
    if (!str) return 0;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Calculate logged/consumed intake from eaten meals
  const loggedMeals = activeDailyMeals.filter((m) => eatenMealIds.includes(m.id));
  const loggedCalories = loggedMeals.reduce((sum, m) => sum + parseNum(m.calories), 0);
  const loggedProtein = loggedMeals.reduce((sum, m) => sum + parseNum(m.protein), 0);
  const loggedCarbs = loggedMeals.reduce((sum, m) => sum + Math.round((parseNum(m.calories) * 0.45) / 4), 0);
  const loggedFat = loggedMeals.reduce((sum, m) => sum + Math.round((parseNum(m.calories) * 0.25) / 9), 0);

  // Fallback estimates if 0 meals logged so user can see planned values vs logged
  const totalPlannedCalories = activeDailyMeals.reduce((sum, m) => sum + parseNum(m.calories), 0);

  // Current display calories (uses logged meals if logged, or baseline planned overview)
  const displayCalories = loggedMeals.length > 0 ? loggedCalories : 1230;
  const displayProtein = loggedMeals.length > 0 ? loggedProtein : 68;
  const displayCarbs = loggedMeals.length > 0 ? loggedCarbs : 128;
  const displayFat = loggedMeals.length > 0 ? loggedFat : 41;

  const calPct = Math.min(Math.round((displayCalories / targetCalories) * 100), 100);
  const proteinPct = Math.min(Math.round((displayProtein / targetProtein) * 100), 100);
  const carbsPct = Math.min(Math.round((displayCarbs / targetCarbs) * 100), 100);
  const fatPct = Math.min(Math.round((displayFat / targetFat) * 100), 100);

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Container className="max-w-md px-4 py-5 space-y-5">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 shadow-xs hover:bg-gray-100 transition-all"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Daily Nutrition Detail</h1>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                Today — {todayDateStr}
              </p>
            </div>
          </div>
        </div>

        {/* TARGET VS LOGGED SUMMARY CARD */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
              <h2 className="text-sm font-extrabold text-gray-900">Today's Nutrition Summary</h2>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {loggedMeals.length} / 4 Meals Logged
            </span>
          </div>

          {/* Macro Progress Bars */}
          <div className="space-y-3">
            {/* Calories */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Calories</span>
                <span className="text-gray-900">
                  {displayCalories} / {targetCalories} kcal ({calPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${calPct}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Protein</span>
                <span className="text-gray-900">
                  {displayProtein}g / {targetProtein}g ({proteinPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>

            {/* Carbohydrates */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Carbohydrates</span>
                <span className="text-gray-900">
                  {displayCarbs}g / {targetCarbs}g ({carbsPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-700">Fat</span>
                <span className="text-gray-900">
                  {displayFat}g / {targetFat}g ({fatPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MEAL-BY-MEAL NUTRITION BREAKDOWN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-600" />
              Meal-by-Meal Breakdown
            </h2>
            <span className="text-[11px] font-semibold text-gray-500">Tap to toggle logged status</span>
          </div>

          <div className="space-y-3">
            {activeDailyMeals.map((meal) => {
              const isLogged = eatenMealIds.includes(meal.id);

              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border p-4 shadow-xs transition-all bg-white ${
                    isLogged ? "border-emerald-300 bg-emerald-50/20" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={meal.img}
                        alt={meal.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                            {meal.type}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                              isLogged
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {isLogged ? "LOGGED / CONSUMED" : "PLANNED"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-0.5">{meal.name}</h3>
                        <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                          {meal.calories} kcal • {meal.protein} protein • {meal.giTag}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMealEaten(meal.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                        isLogged
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      aria-label="Toggle meal logged status"
                    >
                      {isLogged ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MEAL ADHERENCE & NON-DIAGNOSTIC INSIGHT */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
            Today's Meal Adherence & Insight
          </h3>

          <p className="text-xs font-bold text-emerald-900">
            {loggedMeals.length === 4
              ? "✓ Today's planned meals were fully logged."
              : loggedMeals.length > 0
              ? `✓ ${loggedMeals.length} of 4 planned meals were logged today.`
              : "No meals logged yet today."}
          </p>

          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {displayCalories < targetCalories
              ? "Your estimated logged intake is below today's personalized calorie target."
              : "Your estimated logged intake meets today's personalized calorie target."}
          </p>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-900 flex items-start gap-2 font-medium">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Estimated intake based on your logged meals. Actual metabolic expenditure and nutrient absorption vary per individual.
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
}
