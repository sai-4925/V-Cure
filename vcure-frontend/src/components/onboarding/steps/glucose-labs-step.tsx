"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Info } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { glucoseLabsSchema, type GlucoseLabsFormValues } from "@/lib/validation/onboarding";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useTranslation } from "@/hooks/use-translation";

export function GlucoseLabsStep() {
  const draft = useOnboardingStore((state) => state.draft.glucoseLabs);
  const updateGlucoseLabs = useOnboardingStore((state) => state.updateGlucoseLabs);
  const goNext = useOnboardingStore((state) => state.goNext);
  const goBack = useOnboardingStore((state) => state.goBack);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<GlucoseLabsFormValues>({
    resolver: zodResolver(glucoseLabsSchema),
    defaultValues: {
      fastingGlucoseMgDl: draft.fastingGlucoseMgDl ?? undefined,
      randomGlucoseMgDl: draft.randomGlucoseMgDl ?? undefined,
      hba1cPercent: draft.hba1cPercent ?? undefined,
      dontKnowWillUploadReport: draft.dontKnowWillUploadReport || false
    }
  });

  const onSubmit = (values: GlucoseLabsFormValues) => {
    updateGlucoseLabs(values);
    goNext();
  };

  const handleDontKnow = () => {
    setValue("dontKnowWillUploadReport", true);
    updateGlucoseLabs({
      fastingGlucoseMgDl: undefined,
      randomGlucoseMgDl: undefined,
      hba1cPercent: undefined,
      dontKnowWillUploadReport: true
    });
    goNext();
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
        <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          {t.healthScoreSubtitle}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={t.fastingGlucose}
          type="number"
          placeholder="e.g. 110"
          error={errors.fastingGlucoseMgDl?.message}
          {...register("fastingGlucoseMgDl")}
        />

        <InputField
          label={t.hba1cLabel}
          type="number"
          step="0.1"
          placeholder="e.g. 6.2"
          error={errors.hba1cPercent?.message}
          {...register("hba1cPercent")}
        />
      </div>

      <InputField
        label={t.postPrandialGlucose}
        type="number"
        placeholder="e.g. 145"
        error={errors.randomGlucoseMgDl?.message}
        {...register("randomGlucoseMgDl")}
      />

      <div className="pt-1">
        <button
          type="button"
          onClick={handleDontKnow}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100/60 transition-all"
        >
          <FileUp className="h-4 w-4 text-emerald-600" />
          {t.uploadNewReport}
        </button>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="rounded-2xl border-gray-200 text-xs font-bold text-gray-600"
        >
          ← {t.back}
        </Button>
        <Button type="submit" className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
          {t.next} →
        </Button>
      </div>
    </form>
  );
}

