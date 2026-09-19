import type { NutritionBreakdown } from "@/types/nutrition";

export type ChatRole = "user" | "assistant";
export type MessageStatus = "sending" | "sent" | "streaming" | "error";
export type SafetyWarningLevel = "info" | "caution" | "blocked";

export interface SafetyWarning {
  level: SafetyWarningLevel;
  message: string;
}

export interface SourceReference {
  id: string;
  title: string;
  type: "article" | "medical_profile" | "meal_plan";
}

export interface AttachedReport {
  name: string;
  size: number;
  type: string;
  url?: string;
  dataUrl?: string;
}

export interface TemperatureReading {
  value: string;
  unit?: string;
  classification?: "Normal" | "Low Grade" | "Moderate" | "High";
}

export interface FollowUpQuestionOption {
  label: string;
  value: string;
}

export interface FollowUpQuestionItem {
  id: string;
  label: string;
  description?: string;
  options?: (string | FollowUpQuestionOption)[];
  unit?: string;
  placeholder?: string;
  inputType?: "text" | "number" | "file";
  accept?: string;
}

export interface FollowUpQuestionConfig {
  questions: (string | FollowUpQuestionItem)[];
  required: string[];
}

export interface RecommendedDietItem {
  id: string;
  name: string;
  quantity: string;
  estimatedPriceInr: number;
  category?: string;
  unit?: string;
}

export interface DietOrderRecommendation {
  id: string;
  title: string;
  description?: string;
  items: RecommendedDietItem[];
  totalPriceInr: number;
  allergySafeNotice?: string;
  excludedAllergens?: string[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  safetyWarning?: SafetyWarning;
  sources?: SourceReference[];
  followUp?: FollowUpQuestionConfig;
  dietOrder?: DietOrderRecommendation;
  attachedReport?: AttachedReport;
  temperatureReading?: TemperatureReading;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface SuggestedQuestion {
  id: string;
  label: string;
  prompt: string;
}

export type QuickPromptCategory = "Health" | "Nutrition";

export interface QuickPrompt {
  id: string;
  category: QuickPromptCategory;
  label: string;
  prompt: string;
}

// Read-only summaries shown alongside the chat — sourced from the same
// medical-history and nutrition data used elsewhere in the app, never
// redeclared as separate domain models.
export interface MedicalContextSnapshot {
  conditions: string[];
  allergies: string[];
  medications: string[];
}

export interface NutritionContextSnapshot {
  today: NutritionBreakdown;
  calorieTargetToday: number;
}
