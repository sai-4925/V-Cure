import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/types/onboarding";

const STEP_LABELS: Record<OnboardingStep, string> = {
  "personal-info": "Personal",
  goals: "Goals",
  "diabetes-category": "Condition",
  "glucose-labs": "Glucose",
  lifestyle: "Lifestyle",
  "food-preferences": "Food",
  allergies: "Allergies",
  "medical-conditions": "Health",
  medications: "Meds",
  "report-upload": "Report"
};

export function ProgressIndicator({ currentStep }: { currentStep: OnboardingStep }) {
  const index = ONBOARDING_STEPS.indexOf(currentStep);
  const currentIndex = index === -1 ? 0 : index;
  const safeStep: OnboardingStep = ONBOARDING_STEPS[currentIndex] ?? ONBOARDING_STEPS[0];
  const percent = Math.round(((currentIndex + 1) / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="space-y-3">
      {/* Step Header */}
      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
        <span className="uppercase tracking-wider text-emerald-700">
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length} — {STEP_LABELS[safeStep]}
        </span>
        <span className="text-gray-400">{percent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Step Dots indicator */}
      <ol className="flex items-center justify-between gap-1 py-1" aria-label="Onboarding steps">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step} className="flex-1 flex justify-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold transition-all",
                  isCompleted && "bg-emerald-600 text-white",
                  isCurrent && "border-2 border-emerald-600 bg-white text-emerald-700 ring-2 ring-emerald-100",
                  !isCompleted && !isCurrent && "bg-gray-100 text-gray-400"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
