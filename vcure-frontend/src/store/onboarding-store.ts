import { create } from "zustand";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/types/onboarding";
import type {
  AllergiesFormValues,
  DiabetesCategoryFormValues,
  FoodPreferencesFormValues,
  GlucoseLabsFormValues,
  GoalsFormValues,
  HealthProfileFormValues,
  LifestyleFormValues,
  MedicalConditionsFormValues,
  MedicalProfileFormValues,
  MedicationsFormValues,
  PersonalInfoFormValues,
  ReportUploadFormValues
} from "@/lib/validation/onboarding";

export interface OnboardingDraft {
  personalInfo: Partial<PersonalInfoFormValues>;
  healthProfile: Partial<HealthProfileFormValues>;
  medicalProfile: MedicalProfileFormValues;
  goals: Partial<GoalsFormValues>;
  diabetesCategory: Partial<DiabetesCategoryFormValues>;
  glucoseLabs: Partial<GlucoseLabsFormValues>;
  lifestyle: Partial<LifestyleFormValues>;
  foodPreferences: Partial<FoodPreferencesFormValues>;
  allergies: Partial<AllergiesFormValues>;
  medicalConditions: Partial<MedicalConditionsFormValues>;
  medications: Partial<MedicationsFormValues>;
  reportUpload: Partial<ReportUploadFormValues>;
  isCompleted: boolean;
}

interface OnboardingState {
  userId: string | null;
  currentStep: OnboardingStep;
  draft: OnboardingDraft;

  initForUser: (userId: string, fullName?: string) => void;
  clearForLogout: () => void;

  goToStep: (step: OnboardingStep) => void;
  goNext: () => void;
  goBack: () => void;
  updatePersonalInfo: (values: PersonalInfoFormValues) => void;
  updateHealthProfile: (values: HealthProfileFormValues) => void;
  updateMedicalProfile: (values: MedicalProfileFormValues) => void;
  updateGoals: (values: GoalsFormValues) => void;
  updateDiabetesCategory: (values: DiabetesCategoryFormValues) => void;
  updateGlucoseLabs: (values: GlucoseLabsFormValues) => void;
  updateLifestyle: (values: LifestyleFormValues) => void;
  updateFoodPreferences: (values: FoodPreferencesFormValues) => void;
  updateAllergies: (values: AllergiesFormValues) => void;
  updateMedicalConditions: (values: MedicalConditionsFormValues) => void;
  updateMedications: (values: MedicationsFormValues) => void;
  updateReportUpload: (values: ReportUploadFormValues) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  personalInfo: {},
  healthProfile: {},
  medicalProfile: { conditions: [], allergies: [], medications: [] },
  goals: {},
  diabetesCategory: {},
  glucoseLabs: { dontKnowWillUploadReport: false },
  lifestyle: {},
  foodPreferences: { avoidIngredients: [] },
  allergies: { allergies: [], intolerances: [] },
  medicalConditions: { conditions: [] },
  medications: { medications: [] },
  reportUpload: { userConfirmedFindings: false },
  isCompleted: false
};

function getStorageKey(userId: string | null): string {
  if (!userId) return "vcure-onboarding-draft:anonymous";
  return `vcure-onboarding-draft:${userId}`;
}

function persistToStorage(userId: string | null, currentStep: OnboardingStep, draft: OnboardingDraft) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = getStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify({ currentStep, draft }));
  } catch (err) {
    // ignore storage quota errors
  }
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  userId: null,
  currentStep: ONBOARDING_STEPS[0],
  draft: initialDraft,

  initForUser: (userId, fullName) => {
    if (typeof window !== "undefined") {
      // Clean legacy global key to prevent data leakage across users
      window.localStorage.removeItem("vcure-onboarding-draft");
      const key = getStorageKey(userId);
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const safeStep = ONBOARDING_STEPS.includes(parsed.currentStep)
            ? parsed.currentStep
            : ONBOARDING_STEPS[0];
          const draft = parsed.draft || { ...initialDraft };
          if (fullName && (!draft.personalInfo?.fullName || draft.personalInfo.fullName.trim() === "")) {
            draft.personalInfo = { ...draft.personalInfo, fullName };
          }
          set({ userId, currentStep: safeStep, draft });
          persistToStorage(userId, safeStep, draft);
          return;
        } catch {
          // parse error, fallback to fresh
        }
      }
    }
    const freshDraft: OnboardingDraft = {
      ...initialDraft,
      personalInfo: { fullName: fullName || "" }
    };
    set({ userId, currentStep: ONBOARDING_STEPS[0], draft: freshDraft });
    persistToStorage(userId, ONBOARDING_STEPS[0], freshDraft);
  },

  clearForLogout: () => {
    set({ userId: null, currentStep: ONBOARDING_STEPS[0], draft: initialDraft });
  },

  goToStep: (step) => {
    const safeStep = ONBOARDING_STEPS.includes(step) ? step : ONBOARDING_STEPS[0];
    set({ currentStep: safeStep });
    persistToStorage(get().userId, safeStep, get().draft);
  },

  goNext: () => {
    const index = ONBOARDING_STEPS.indexOf(get().currentStep);
    const safeIndex = index === -1 ? 0 : index;
    const next = ONBOARDING_STEPS[Math.min(safeIndex + 1, ONBOARDING_STEPS.length - 1)] ?? ONBOARDING_STEPS[0];
    set({ currentStep: next });
    persistToStorage(get().userId, next, get().draft);
  },

  goBack: () => {
    const index = ONBOARDING_STEPS.indexOf(get().currentStep);
    const safeIndex = index === -1 ? 0 : index;
    const previous = ONBOARDING_STEPS[Math.max(safeIndex - 1, 0)] ?? ONBOARDING_STEPS[0];
    set({ currentStep: previous });
    persistToStorage(get().userId, previous, get().draft);
  },

  updatePersonalInfo: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, personalInfo: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateHealthProfile: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, healthProfile: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateMedicalProfile: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, medicalProfile: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateGoals: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, goals: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateDiabetesCategory: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, diabetesCategory: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateGlucoseLabs: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, glucoseLabs: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateLifestyle: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, lifestyle: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateFoodPreferences: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, foodPreferences: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateAllergies: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, allergies: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateMedicalConditions: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, medicalConditions: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateMedications: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, medications: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },
  updateReportUpload: (values) => {
    set((state) => {
      const updatedDraft = { ...state.draft, reportUpload: values };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },

  completeOnboarding: () => {
    set((state) => {
      const updatedDraft = { ...state.draft, isCompleted: true };
      persistToStorage(state.userId, state.currentStep, updatedDraft);
      return { draft: updatedDraft };
    });
  },

  reset: () => {
    const state = get();
    set({ currentStep: ONBOARDING_STEPS[0], draft: initialDraft });
    persistToStorage(state.userId, ONBOARDING_STEPS[0], initialDraft);
  }
}));
