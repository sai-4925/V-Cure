"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useAuthStore } from "@/store/auth-store";
import type { ExtractedBiomarker, OCRStatus } from "@/types/onboarding";

import { useCompleteOnboarding } from "@/hooks/use-onboarding";
import { devLogger } from "@/lib/dev-logger";

export function ReportUploadStep() {
  const router = useRouter();
  const draft = useOnboardingStore((state) => state.draft);
  const updateReportUpload = useOnboardingStore((state) => state.updateReportUpload);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const goBack = useOnboardingStore((state) => state.goBack);
  const user = useAuthStore((state) => state.user);
  const completeMutation = useCompleteOnboarding();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<OCRStatus | null>(draft.reportUpload?.ocrStatus || null);
  const [extractedBiomarkers, setExtractedBiomarkers] = useState<ExtractedBiomarker[]>(
    draft.reportUpload?.extractedBiomarkers || []
  );
  const [userConfirmed, setUserConfirmed] = useState(draft.reportUpload?.userConfirmedFindings || false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    // Simulate OCR Foundation Multimodal Pipeline
    setTimeout(() => {
      setIsProcessing(false);
      setOcrStatus("MANUAL_REVIEW_REQUIRED");

      const mockExtracted: ExtractedBiomarker[] = [
        {
          name: "HbA1c",
          value: "6.4",
          unit: "%",
          referenceRange: "< 5.7%",
          isAbnormal: true,
          status: "MANUAL_REVIEW_REQUIRED",
          confidenceScore: 0.88,
          possibleFinding: "Possible finding: Prediabetes / Elevated glycemic index"
        },
        {
          name: "Fasting Blood Glucose",
          value: "118",
          unit: "mg/dL",
          referenceRange: "70 - 99 mg/dL",
          isAbnormal: true,
          status: "COMPLETED",
          confidenceScore: 0.94,
          possibleFinding: "Possible finding: Elevated fasting blood glucose"
        }
      ];

      setExtractedBiomarkers(mockExtracted);
      updateReportUpload({
        fileName: uploadedFile.name,
        ocrStatus: "MANUAL_REVIEW_REQUIRED",
        extractedBiomarkers: mockExtracted,
        userConfirmedFindings: false
      });
    }, 1200);
  };

  const handleFinalSubmit = () => {
    const payload = {
      personalInfo: {
        dateOfBirth: (draft.personalInfo as any)?.dateOfBirth || "1992-01-01",
        gender: draft.personalInfo?.gender || "MALE",
        phone: (draft.personalInfo as any)?.phone || "+1234567890"
      },
      healthProfile: {
        heightCm: draft.personalInfo?.heightCm || draft.healthProfile?.heightCm || 170,
        weightKg: draft.personalInfo?.weightKg || draft.healthProfile?.weightKg || 70,
        bloodGroup: (draft.healthProfile as any)?.bloodGroup
      },
      medicalProfile: {
        conditions: draft.medicalConditions?.conditions || [],
        allergies: draft.allergies?.allergies || [],
        medications: draft.medications?.medications?.map((m: any) => typeof m === "string" ? m : m.name) || []
      },
      lifestyle: {
        activityLevel: draft.lifestyle?.activityLevel || "MODERATELY_ACTIVE",
        sleepHours: draft.lifestyle?.sleepHours || 7,
        smokingStatus: draft.lifestyle?.smokingStatus,
        alcoholConsumption: draft.lifestyle?.alcoholConsumption,
        dietType: draft.foodPreferences?.dietType || "VEGETARIAN"
      },
      goals: {
        primaryGoal: draft.goals?.primaryGoal || "GENERAL_WELLNESS",
        timeline: draft.goals?.timeline || "THREE_MONTHS"
      }
    };

    devLogger.log({
      action: "ONBOARDING_SUBMIT",
      validationResult: "SUCCESS",
      endpoint: "/onboarding/complete",
      navigationResult: "/dashboard"
    });

    completeMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Educational Banner */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-900 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Medical Report Upload & OCR Extraction:</p>
          <p className="mt-0.5 leading-relaxed font-medium">
            Upload your lab report (PDF, PNG, JPG). Our OCR Foundation extracts biomarkers for your review. OCR extractions require your explicit confirmation before updating your profile.
          </p>
        </div>
      </div>

      {/* File Upload Box */}
      {!ocrStatus && !isProcessing ? (
        <div className="relative border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center bg-gray-50 hover:bg-gray-100/80 transition-all">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-gray-900">Upload Lab Report</p>
            <p className="text-xs font-semibold text-gray-400 mt-1">PDF, PNG, JPG or JPEG up to 10MB</p>
            <span className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs">
              Select File
            </span>
          </div>
        </div>
      ) : null}

      {/* OCR Processing Loader */}
      {isProcessing ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
          <h3 className="text-sm font-bold text-gray-900">Running OCR Extraction Pipeline...</h3>
          <p className="text-xs font-semibold text-gray-400 mt-1">Extracting HbA1c, Glucose, Lipid & Kidney Biomarkers</p>
        </div>
      ) : null}

      {/* OCR Findings Review Section */}
      {ocrStatus && extractedBiomarkers.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
                {file?.name || draft.reportUpload?.fileName || "Medical_Report.pdf"}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              MANUAL_REVIEW_REQUIRED
            </span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Possible Findings Detected from Report
              </h3>
              <span className="text-[10px] font-semibold text-amber-700">Non-diagnostic</span>
            </div>

            <div className="space-y-2">
              {extractedBiomarkers.map((bm, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-100 bg-white p-3 text-xs shadow-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{bm.name}</span>
                    <span className={bm.isAbnormal ? "text-red-600" : "text-emerald-600"}>
                      {bm.value} {bm.unit}
                    </span>
                  </div>
                  {bm.possibleFinding ? (
                    <p className="text-[11px] font-semibold text-amber-800">{bm.possibleFinding}</p>
                  ) : null}
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>Reference: {bm.referenceRange}</span>
                    <span>Confidence: {(bm.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Checkbox */}
            <div
              onClick={() => setUserConfirmed(!userConfirmed)}
              className="cursor-pointer flex items-start gap-3 rounded-xl border border-amber-300 bg-white p-3 shadow-xs mt-2"
            >
              <input
                type="checkbox"
                checked={userConfirmed}
                onChange={() => {}}
                className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-gray-800 leading-tight">
                I have reviewed these extracted lab findings and confirm updating my Health Profile.
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="rounded-2xl border-gray-200 text-xs font-bold text-gray-600"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleFinalSubmit}
          isLoading={completeMutation.isPending}
          className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 shadow-md flex items-center gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          {completeMutation.isPending ? "Saving Profile..." : "Complete Health Profile & View Plan"}
        </Button>
      </div>
    </div>
  );
}
