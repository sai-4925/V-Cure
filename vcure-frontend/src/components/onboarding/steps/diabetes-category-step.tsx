"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, HeartHandshake, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diabetesCategorySchema, type DiabetesCategoryFormValues } from "@/lib/validation/onboarding";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { DiabetesCategory, DiabetesDuration } from "@/types/onboarding";

const CATEGORIES: { value: DiabetesCategory; label: string; desc: string }[] = [
  { value: "NO_DIABETES", label: "No Diabetes", desc: "General wellness, metabolic optimization, and healthy weight" },
  { value: "PREDIABETES", label: "Prediabetes", desc: "Elevated blood sugar levels, focusing on prevention and lifestyle" },
  { value: "TYPE1_DIABETES", label: "Type 1 Diabetes", desc: "Autoimmune condition focusing on carbohydrate awareness" },
  { value: "TYPE2_DIABETES", label: "Type 2 Diabetes", desc: "Insulin resistance management via low-GI dietary guidance" },
  { value: "GESTATIONAL_DIABETES", label: "Gestational Diabetes", desc: "Blood sugar management during pregnancy" },
  { value: "OTHER", label: "Other / Not sure", desc: "Uncertain or other health condition (e.g. PCOS, Thyroid, BP)" }
];

const DURATIONS: { value: DiabetesDuration; label: string }[] = [
  { value: "LESS_THAN_6_MONTHS", label: "Less than 6 months" },
  { value: "SIX_MONTHS_TO_1_YEAR", label: "6 months – 1 year" },
  { value: "ONE_TO_3_YEARS", label: "1 – 3 years" },
  { value: "THREE_TO_5_YEARS", label: "3 – 5 years" },
  { value: "MORE_THAN_5_YEARS", label: "More than 5 years" },
  { value: "NOT_SURE", label: "Not sure" }
];

export function DiabetesCategoryStep() {
  const draft = useOnboardingStore((state) => state.draft.diabetesCategory);
  const updateDiabetesCategory = useOnboardingStore((state) => state.updateDiabetesCategory);
  const goNext = useOnboardingStore((state) => state.goNext);
  const goBack = useOnboardingStore((state) => state.goBack);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<DiabetesCategoryFormValues>({
    resolver: zodResolver(diabetesCategorySchema),
    defaultValues: {
      category: draft.category || "NO_DIABETES",
      duration: draft.duration || "NOT_SURE",
      isGestational: draft.isGestational || false
    }
  });

  const selectedCategory = watch("category");
  const selectedDuration = watch("duration");

  const onSubmit = (values: DiabetesCategoryFormValues) => {
    updateDiabetesCategory({
      ...values,
      isGestational: values.category === "GESTATIONAL_DIABETES"
    });
    goNext();
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      {/* QUESTION 1: DIAGNOSIS STATUS */}
      <div className="space-y-3">
        <label className="block text-sm font-extrabold text-gray-900">
          Have you been diagnosed with diabetes or prediabetes?
        </label>

        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <div
                key={cat.value}
                onClick={() => setValue("category", cat.value)}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all shadow-xs ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900">{cat.label}</h3>
                  <div
                    className={`h-4 w-4 rounded-full border ${
                      isSelected ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                    }`}
                  />
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">{cat.desc}</p>
              </div>
            );
          })}
        </div>
        {errors.category ? (
          <p className="text-xs text-red-600 font-semibold">{errors.category.message}</p>
        ) : null}
      </div>

      {/* QUESTION 2: DURATION */}
      {selectedCategory !== "NO_DIABETES" ? (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <label className="block text-sm font-extrabold text-gray-900">
            How long have you had this condition?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((dur) => {
              const isSelected = selectedDuration === dur.value;
              return (
                <button
                  key={dur.value}
                  type="button"
                  onClick={() => setValue("duration", dur.value)}
                  className={`rounded-xl border p-2.5 text-xs font-semibold transition-all text-left ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {dur.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1">
            <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            Duration is supporting context only and does not determine or override your diagnosis.
          </p>
        </div>
      ) : null}

      {/* Safety Notice: Other / Not sure */}
      {selectedCategory === "OTHER" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            If you are not sure of your exact diagnosis, please confirm with your latest medical lab report or treating doctor.
          </p>
        </div>
      ) : null}

      {/* Safety Notice: Type 1 Diabetes */}
      {selectedCategory === "TYPE1_DIABETES" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Type 1 Diabetes Safety Lock:</p>
            <p className="mt-0.5 leading-relaxed font-medium">
              Meal recommendations support carbohydrate awareness. Do not use V-Cure to calculate or modify insulin doses.
            </p>
          </div>
        </div>
      ) : null}

      {/* Safety Notice: Gestational Diabetes */}
      {selectedCategory === "GESTATIONAL_DIABETES" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
          <HeartHandshake className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gestational Pregnancy Support:</p>
            <p className="mt-0.5 leading-relaxed font-medium">
              Recommendations follow pregnancy-specific meal guidelines. Always coordinate your care with your obstetrician and diabetes care team.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="rounded-2xl border-gray-200 text-xs font-bold text-gray-600"
        >
          ← Back
        </Button>
        <Button type="submit" className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
          Continue →
        </Button>
      </div>
    </form>
  );
}
