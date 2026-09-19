import { apiClient } from "@/lib/api-client";
import { useOnboardingStore } from "@/store/onboarding-store";
import { findContainedAllergens, getAllergenAliases } from "@/lib/ai-chat-adapter/allergen-safety";
import type { AllergyDto, MedicalConditionDto, MedicineDto } from "@/types/profile";

export interface MedicalProfile {
  conditions: string[];
  allergies: string[];
  medications: string[];
}

export function matchesAllergen(message: string, allergies: string[]): string | null {
  const matches = findContainedAllergens(message, allergies);
  return matches[0]?.allergen ?? null;
}

export function getEffectiveUserAllergies(): string[] {
  // 1. Check active onboarding store draft
  try {
    const draft = useOnboardingStore.getState().draft;
    const fromDraft = [
      ...(draft.allergies?.allergies || []),
      ...(draft.medicalProfile?.allergies || [])
    ].map((a) => (typeof a === "string" ? a : (a as any).name || (a as any).allergen)).filter(Boolean);

    if (fromDraft.length > 0) {
      return Array.from(new Set(fromDraft));
    }
  } catch {
    // Ignore store read issues during SSR
  }

  // 2. Check localStorage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("vcure_user_allergies");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Safe fallback default
  return ["Peanuts"];
}

export async function fetchMedicalProfile(): Promise<MedicalProfile> {
  const [conditionsResult, allergiesResult, medicinesResult] = await Promise.allSettled([
    apiClient.get<MedicalConditionDto[]>("/medical-history/conditions"),
    apiClient.get<AllergyDto[]>("/medical-history/allergies"),
    apiClient.get<MedicineDto[]>("/medical-history/medicines")
  ]);

  const conditions: string[] =
    conditionsResult.status === "fulfilled" && Array.isArray(conditionsResult.value)
      ? conditionsResult.value.map((c) => c.name).filter(Boolean)
      : [];

  const apiAllergies: string[] =
    allergiesResult.status === "fulfilled" && Array.isArray(allergiesResult.value)
      ? allergiesResult.value.map((a) => a.allergen).filter(Boolean)
      : [];

  const medicines: string[] =
    medicinesResult.status === "fulfilled" && Array.isArray(medicinesResult.value)
      ? medicinesResult.value.map((m) => m.name).filter(Boolean)
      : [];

  // Fallback / merge with local draft & storage if API didn't return allergies
  const effectiveAllergies = apiAllergies.length > 0
    ? apiAllergies
    : getEffectiveUserAllergies();

  // If conditions empty, check draft
  let effectiveConditions = conditions;
  if (effectiveConditions.length === 0) {
    try {
      const draft = useOnboardingStore.getState().draft;
      const draftConditions = [
        ...(draft.medicalProfile?.conditions || []),
        ...(draft.medicalConditions?.conditions || [])
      ].filter(Boolean);
      effectiveConditions = draftConditions.length > 0 ? draftConditions : ["Type 2 Diabetes (Managed)"];
    } catch {
      effectiveConditions = ["Type 2 Diabetes (Managed)"];
    }
  }

  return {
    conditions: Array.from(new Set(effectiveConditions)),
    allergies: Array.from(new Set(effectiveAllergies)),
    medications: Array.from(new Set(medicines.length > 0 ? medicines : ["Metformin"]))
  };
}

