"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/ui/input-field";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { personalInfoSchema, type PersonalInfoFormValues } from "@/lib/validation/onboarding";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "@/hooks/use-translation";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" }
];

export function PersonalInfoStep() {
  const authUser = useAuthStore((state) => state.user);
  const draft = useOnboardingStore((state) => state.draft.personalInfo);
  const updatePersonalInfo = useOnboardingStore((state) => state.updatePersonalInfo);
  const goNext = useOnboardingStore((state) => state.goNext);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: draft.fullName || authUser?.fullName || "",
      age: draft.age ?? undefined,
      gender: draft.gender || "MALE",
      heightCm: draft.heightCm ?? undefined,
      weightKg: draft.weightKg ?? undefined
    }
  });

  const onSubmit = (values: PersonalInfoFormValues) => {
    updatePersonalInfo(values);
    goNext();
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <InputField
        label={t.fullNameLabel}
        type="text"
        placeholder="Enter your name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={t.ageLabel}
          type="number"
          placeholder="e.g. 32"
          error={errors.age?.message}
          {...register("age")}
        />

        <SelectField
          label={t.genderLabel}
          options={GENDER_OPTIONS}
          error={errors.gender?.message}
          {...register("gender")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={t.heightLabel}
          type="number"
          placeholder="e.g. 170"
          error={errors.heightCm?.message}
          {...register("heightCm")}
        />

        <InputField
          label={t.weightLabel}
          type="number"
          placeholder="e.g. 70"
          error={errors.weightKg?.message}
          {...register("weightKg")}
        />
      </div>

      <div className="flex justify-end pt-3">
        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"
        >
          {t.next} →
        </Button>
      </div>
    </form>
  );
}

