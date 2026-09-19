"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useAuthStore } from "@/store/auth-store";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { PersonalInfoStep } from "@/components/onboarding/steps/personal-info-step";
import { GoalsStep } from "@/components/onboarding/steps/goals-step";
import { DiabetesCategoryStep } from "@/components/onboarding/steps/diabetes-category-step";
import { GlucoseLabsStep } from "@/components/onboarding/steps/glucose-labs-step";
import { LifestyleStep } from "@/components/onboarding/steps/lifestyle-step";
import { FoodPreferencesStep } from "@/components/onboarding/steps/food-preferences-step";
import { AllergiesStep } from "@/components/onboarding/steps/allergies-step";
import { MedicalConditionsStep } from "@/components/onboarding/steps/medical-conditions-step";
import { MedicationsStep } from "@/components/onboarding/steps/medications-step";
import { ReportUploadStep } from "@/components/onboarding/steps/report-upload-step";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/types/onboarding";

const STEP_COPY: Record<OnboardingStep, { title: string; subtitle: string }> = {
  "personal-info": {
    title: "1. Personal Information",
    subtitle: "Baseline profile data for BMI and metabolic target calculation."
  },
  goals: {
    title: "2. Health & Fitness Goals",
    subtitle: "Select your primary target to personalize your V-Cure experience."
  },
  "diabetes-category": {
    title: "3. Health & Diabetes Category",
    subtitle: "Select your metabolic condition to shape your recommendation rules."
  },
  "glucose-labs": {
    title: "4. Glucose & Lab Information",
    subtitle: "Enter available blood glucose and HbA1c values, or upload a report."
  },
  lifestyle: {
    title: "5. Lifestyle Assessment",
    subtitle: "Activity level, sleep habits, and stress information."
  },
  "food-preferences": {
    title: "6. Dietary Preferences",
    subtitle: "Select your food choices so meal recommendations match your diet."
  },
  allergies: {
    title: "7. Food Allergies & Safety",
    subtitle: "Select allergies to be hard-blocked by V-Cure's Safety Engine."
  },
  "medical-conditions": {
    title: "8. Other Health Conditions",
    subtitle: "Diagnosed conditions for renal, hepatic, or cardiovascular rules."
  },
  medications: {
    title: "9. Current Medications",
    subtitle: "Cross-referenced with drug-food interaction safety rules."
  },
  "report-upload": {
    title: "10. Medical Report Upload & Review",
    subtitle: "Upload lab reports for OCR extraction and confirm health findings."
  }
};

export default function OnboardingPage() {
  const authUser = useAuthStore((state) => state.user);
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const initForUser = useOnboardingStore((state) => state.initForUser);
  const goToStep = useOnboardingStore((state) => state.goToStep);

  // Initialize store for authenticated user's isolated state
  useEffect(() => {
    if (authUser?.id) {
      initForUser(authUser.id, authUser.fullName);
    }
  }, [authUser?.id, authUser?.fullName, initForUser]);

  const isStepValid = ONBOARDING_STEPS.includes(currentStep);

  useEffect(() => {
    if (!isStepValid) {
      goToStep(ONBOARDING_STEPS[0]);
    }
  }, [isStepValid, goToStep]);

  const activeStep = isStepValid ? currentStep : ONBOARDING_STEPS[0];
  const copy = STEP_COPY[activeStep] ?? STEP_COPY[ONBOARDING_STEPS[0]];

  return (
    <OnboardingLayout currentStep={activeStep} title={copy.title} subtitle={copy.subtitle}>
      {activeStep === "personal-info" ? <PersonalInfoStep /> : null}
      {activeStep === "goals" ? <GoalsStep /> : null}
      {activeStep === "diabetes-category" ? <DiabetesCategoryStep /> : null}
      {activeStep === "glucose-labs" ? <GlucoseLabsStep /> : null}
      {activeStep === "lifestyle" ? <LifestyleStep /> : null}
      {activeStep === "food-preferences" ? <FoodPreferencesStep /> : null}
      {activeStep === "allergies" ? <AllergiesStep /> : null}
      {activeStep === "medical-conditions" ? <MedicalConditionsStep /> : null}
      {activeStep === "medications" ? <MedicationsStep /> : null}
      {activeStep === "report-upload" ? <ReportUploadStep /> : null}
    </OnboardingLayout>
  );
}
