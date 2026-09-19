"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Globe
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useLanguageStore } from "@/store/language-store";
import { calculateHealthScore } from "@/lib/health-score";
import { UserProfileSection } from "@/components/profile/user-profile-section";
import { HealthProfileSection } from "@/components/profile/health-profile-section";
import { ConditionsSection } from "@/components/profile/conditions-section";
import { AllergiesSection } from "@/components/profile/allergies-section";
import { MedicinesSection } from "@/components/profile/medicines-section";
import { LifestyleSection } from "@/components/profile/lifestyle-section";
import { GoalsSection } from "@/components/profile/goals-section";
import { FamilyFriendsSection } from "@/components/profile/family-friends-section";
import { HealthVaultSection } from "@/components/profile/health-vault-section";
import { FitnessDevicesSection } from "@/components/profile/fitness-devices-section";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Language } from "@/constants/translations";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const draft = useOnboardingStore((state) => state.draft);
  const currentLang = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = useLanguageStore((state) => state.getTranslation());

  const [activeTab, setActiveTab] = useState<"overview" | "family" | "vault" | "devices" | "edit-medical">("overview");

  const userName = draft.personalInfo?.fullName
    ? draft.personalInfo.fullName
    : user?.fullName && user.fullName.trim() !== ""
    ? user.fullName
    : "User";
  const userEmail = user?.email || "";
  const userAvatar = user?.avatarUrl || (draft.personalInfo as any)?.avatarUrl || null;

  // Calculate dynamic non-diagnostic health score and BMI
  const healthScore = calculateHealthScore(draft);
  const heightMeters = (draft.personalInfo?.heightCm || draft.healthProfile?.heightCm || 170) / 100;
  const weightKg = draft.personalInfo?.weightKg || draft.healthProfile?.weightKg || 70;
  const calculatedBmi = (weightKg / (heightMeters * heightMeters)).toFixed(1);

  const conditionCount =
    (draft.medicalConditions?.conditions || draft.medicalProfile?.conditions || []).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Container className="max-w-md px-4 py-6 space-y-6">
        {/* User Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar src={userAvatar} name={userName} size="lg" />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{userName}</h1>
              {userEmail ? (
                <p className="text-xs font-medium text-gray-400 truncate max-w-[200px]">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>
          <Link
            href="/onboarding"
            className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
          >
            Edit Profile
          </Link>
        </div>

        {/* Dynamic Health Stats Summary Card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md grid grid-cols-3 text-center divide-x divide-gray-100">
          <div>
            <div className="text-xl font-black text-emerald-600">{healthScore}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              {t.healthScoreLabel}
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-emerald-600">{calculatedBmi}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              {t.bmiLabel}
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-emerald-600">{conditionCount}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              {t.conditionsLabel}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Overview, Devices, Family, Vault, Edit Medical) */}
        <div className="flex rounded-2xl bg-gray-200/70 p-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              activeTab === "overview" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("devices")}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              activeTab === "devices" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
            }`}
          >
            Devices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              activeTab === "family" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
            }`}
          >
            Family
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              activeTab === "vault" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
            }`}
          >
            Vault
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit-medical")}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
              activeTab === "edit-medical" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
            }`}
          >
            Edit Profile
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Diabetes Category Banner */}
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Diabetes Category
                </span>
                <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                  {draft.diabetesCategory?.category?.replace("_", " ") || "PREDIABETES"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-800/90 leading-relaxed">
                Your meals &amp; AI guidance are personalized specifically for{" "}
                <span className="font-bold">
                  {draft.diabetesCategory?.category?.replace("_", " ") || "Prediabetes"}
                </span>.
              </p>
            </div>

            {/* Fitness Wearables Showcase Section */}
            <FitnessDevicesSection />

            {/* Quick Access to Family & Health Vault */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("family")}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md text-left hover:border-emerald-300 transition-all space-y-1"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-gray-900">{t.familyFriendsTitle}</h3>
                <p className="text-[10px] font-medium text-gray-400">Consent-based family monitoring</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("vault")}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md text-left hover:border-emerald-300 transition-all space-y-1"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-gray-900">{t.healthVaultTitle}</h3>
                <p className="text-[10px] font-medium text-gray-400">Digital reports &amp; insurance</p>
              </button>
            </div>

            {/* LEARN & SHOP SECTION */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                LEARN &amp; SHOP
              </span>
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md divide-y divide-gray-100">
                <Link
                  href="/education"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Health Education</h3>
                      <p className="text-[11px] font-medium text-gray-400">
                        Diabetes, BP, PCOS, myths
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/shopping"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Grocery List</h3>
                      <p className="text-[11px] font-medium text-gray-400">
                        Personalized ingredients
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </>
        ) : activeTab === "devices" ? (
          <FitnessDevicesSection />
        ) : activeTab === "family" ? (
          <FamilyFriendsSection />
        ) : activeTab === "vault" ? (
          <HealthVaultSection />
        ) : (
          /* EDIT MEDICAL RECORDS TAB */
          <div className="space-y-6">
            <UserProfileSection />
            <HealthProfileSection />
            <ConditionsSection />
            <AllergiesSection />
            <MedicinesSection />
            <LifestyleSection />
            <GoalsSection />
          </div>
        )}

        {/* LANGUAGE SETTINGS SECTION */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
            LANGUAGE & APP
          </span>
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t.changeLanguage}</h3>
                  <p className="text-[11px] font-medium text-gray-400">English vs native Telugu UI</p>
                </div>
              </div>
            </div>

            <div className="flex rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  currentLang === "en" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("te")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  currentLang === "te" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>

        {/* LOGOUT SECTION */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md">
          <button
            type="button"
            onClick={() => clearSession()}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-600">Sign out</h3>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </Container>
    </div>
  );
}
