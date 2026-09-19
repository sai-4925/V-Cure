"use client";

import { useOnboardingStore } from "@/store/onboarding-store";
import { ShieldCheck, ExternalLink, Cpu, HeartPulse, Scale, Activity } from "lucide-react";

export function RecommendedHealthDevicesSection() {
  const draft = useOnboardingStore((state) => state.draft);

  const category = draft.diabetesCategory?.category;
  const isDiabetesOrPrediabetes =
    category === "TYPE1_DIABETES" ||
    category === "TYPE2_DIABETES" ||
    category === "PREDIABETES" ||
    category === "GESTATIONAL_DIABETES";

  const hasHighBP = draft.medicalConditions?.conditions?.some((c) =>
    c.toLowerCase().includes("hypertension") || c.toLowerCase().includes("blood pressure")
  );

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Recommended Health Devices</h2>
            <p className="text-[11px] font-semibold text-gray-400">Optional monitoring tools for self-care</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
          Optional Tools
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Conditional Blood Glucose Meter / CGM */}
        {isDiabetesOrPrediabetes ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  Glucose Monitoring
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  Condition Matched
                </span>
              </div>
              <h3 className="text-xs font-bold text-gray-900 mt-1">Blood Glucose Meter / CGM</h3>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5 leading-relaxed">
                May help you record and review glucose readings to share with your care clinician.
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10px] font-semibold text-emerald-800">
              <span>External Product</span>
              <span className="flex items-center gap-0.5 text-emerald-700 font-bold hover:underline cursor-pointer">
                View Options <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        ) : null}

        {/* Blood Pressure Monitor */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5 text-blue-600" />
                Cardiovascular
              </span>
              {hasHighBP ? (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800">
                  Care Plan
                </span>
              ) : null}
            </div>
            <h3 className="text-xs font-bold text-gray-900 mt-1">Digital Blood Pressure Monitor</h3>
            <p className="text-[11px] font-medium text-gray-600 mt-0.5 leading-relaxed">
              Provides home systolic and diastolic blood pressure readings for your personal records.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[10px] font-semibold text-gray-500">
            <span>Optional External Device</span>
            <span className="flex items-center gap-0.5 text-gray-700 font-bold hover:underline cursor-pointer">
              Explore <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Smart Body Weight Scale */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-purple-800 tracking-wider flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-purple-600" />
                Body Composition
              </span>
            </div>
            <h3 className="text-xs font-bold text-gray-900 mt-1">Smart Weight Scale</h3>
            <p className="text-[11px] font-medium text-gray-600 mt-0.5 leading-relaxed">
              Supports consistent weight logging to observe changes alongside your nutrition habits.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[10px] font-semibold text-gray-500">
            <span>Optional External Device</span>
            <span className="flex items-center gap-0.5 text-gray-700 font-bold hover:underline cursor-pointer">
              Explore <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 font-medium text-center pt-1">
        V-Cure does not mandate specific device brands. Devices shown are optional third-party products.
      </p>
    </div>
  );
}
