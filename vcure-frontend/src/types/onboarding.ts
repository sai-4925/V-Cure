// Onboarding DTOs — 9-Step Full Health Profile & Medical Report Analysis

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export type DiabetesCategory =
  | "PREDIABETES"
  | "TYPE1_DIABETES"
  | "TYPE2_DIABETES"
  | "GESTATIONAL_DIABETES"
  | "NO_DIABETES"
  | "OTHER";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE";

export type StressLevel = "LOW" | "MODERATE" | "HIGH";

export type SmokingStatus = "NEVER" | "FORMER" | "CURRENT";

export type AlcoholConsumption = "NONE" | "OCCASIONAL" | "REGULAR" | "FREQUENT";

export type DietType =
  | "OMNIVORE"
  | "VEGETARIAN"
  | "EGGETARIAN"
  | "VEGAN"
  | "PESCATARIAN"
  | "KETO";

export type PrimaryGoal =
  | "WEIGHT_LOSS"
  | "WEIGHT_GAIN"
  | "MANAGE_CONDITION"
  | "IMPROVE_FITNESS"
  | "GENERAL_WELLNESS";

export type GoalTimeline = "ONE_MONTH" | "THREE_MONTHS" | "SIX_MONTHS" | "ONGOING";

export type OCRStatus = "COMPLETED" | "MANUAL_REVIEW_REQUIRED" | "FAILED";

export interface PersonalInfoDto {
  fullName?: string;
  age?: number;
  dateOfBirth?: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  phone?: string;
}

export type DiabetesDuration =
  | "LESS_THAN_6_MONTHS"
  | "SIX_MONTHS_TO_1_YEAR"
  | "ONE_TO_3_YEARS"
  | "THREE_TO_5_YEARS"
  | "MORE_THAN_5_YEARS"
  | "NOT_SURE";

export type RegionalCuisine =
  | "ANDHRA"
  | "TELANGANA"
  | "TAMIL_NADU"
  | "KARNATAKA"
  | "KERALA"
  | "MAHARASHTRA"
  | "NORTH_INDIAN"
  | "BENGALI"
  | "OTHER";

export interface DiabetesCategoryDto {
  category: DiabetesCategory;
  duration?: DiabetesDuration;
  isGestational: boolean;
  notes?: string;
}

export interface GlucoseLabsDto {
  fastingGlucoseMgDl?: number;
  randomGlucoseMgDl?: number;
  hba1cPercent?: number;
  dontKnowWillUploadReport: boolean;
}

export interface LifestyleAssessmentDto {
  activityLevel: ActivityLevel;
  exerciseFrequencyDaysPerWeek?: number;
  sleepHours: number;
  stressLevel: StressLevel;
  smokingStatus: SmokingStatus;
  alcoholConsumption: AlcoholConsumption;
}

export interface FoodPreferencesDto {
  dietType: DietType;
  regionalCuisine?: RegionalCuisine;
  eggPreference: boolean;
  avoidIngredients: string[];
}

export interface AllergiesDto {
  allergies: string[];
  intolerances: string[];
}

export interface MedicalConditionsDto {
  conditions: string[];
}

export interface MedicationsDto {
  medications: string[];
}

export interface ExtractedBiomarker {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  status: OCRStatus;
  confidenceScore: number;
  possibleFinding?: string;
}

export interface ReportUploadDto {
  fileName?: string;
  fileType?: string;
  ocrStatus?: OCRStatus;
  extractedBiomarkers?: ExtractedBiomarker[];
  userConfirmedFindings?: boolean;
}

export interface GoalsDto {
  primaryGoal: PrimaryGoal;
  timeline: GoalTimeline;
}

export interface OnboardingDraftDto {
  personalInfo: Partial<PersonalInfoDto>;
  diabetesCategory: Partial<DiabetesCategoryDto>;
  glucoseLabs: Partial<GlucoseLabsDto>;
  lifestyle: Partial<LifestyleAssessmentDto>;
  foodPreferences: Partial<FoodPreferencesDto>;
  allergies: Partial<AllergiesDto>;
  medicalConditions: Partial<MedicalConditionsDto>;
  medications: Partial<MedicationsDto>;
  reportUpload: Partial<ReportUploadDto>;
  goals: Partial<GoalsDto>;
}

export type OnboardingCompletePayloadDto = any;

export interface OnboardingCompleteResponseDto {
  onboardingCompleted: true;
  bmi: number;
  riskFlags: string[];
}

export const ONBOARDING_STEPS = [
  "personal-info",
  "goals",
  "diabetes-category",
  "glucose-labs",
  "lifestyle",
  "food-preferences",
  "allergies",
  "medical-conditions",
  "medications",
  "report-upload"
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
