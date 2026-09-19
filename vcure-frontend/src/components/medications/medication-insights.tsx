"use client";

import { useState, useEffect } from "react";
import { Pill, AlertTriangle, ShieldAlert, Info, Activity, Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export interface UserMedicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  isActive?: boolean;
}

// Authoritative reference database for common health & metabolic medications
const MEDICATION_KNOWLEDGE_BASE: Record<
  string,
  {
    purpose: string;
    systemAffected: string;
    howItWorks: string;
    monitoredLabs: string[];
    sideEffects: string[];
    importantWarnings: string[];
    whenToContactDoctor: string[];
  }
> = {
  metformin: {
    purpose: "Management of blood glucose levels in Type 2 Diabetes and Insulin Resistance.",
    systemAffected: "Endocrine / Metabolic & Gastrointestinal Systems",
    howItWorks: "Helps decrease glucose production in the liver and improves insulin sensitivity in body tissues.",
    monitoredLabs: ["Fasting Blood Glucose", "HbA1c", "Kidney Function (eGFR / Serum Creatinine)", "Vitamin B12 levels"],
    sideEffects: ["Mild stomach discomfort", "Nausea", "Changes in bowel habits (diarrhea)", "Metallic taste"],
    importantWarnings: [
      "Inform your clinician before receiving IV contrast dye procedures.",
      "Discuss with your healthcare provider if experiencing persistent nausea or muscle aches."
    ],
    whenToContactDoctor: [
      "Unusual severe fatigue, muscle pain, or difficulty breathing",
      "Persistent severe stomach upset that does not resolve"
    ]
  },
  glimepiride: {
    purpose: "Assists the pancreas in releasing insulin to manage blood glucose.",
    systemAffected: "Endocrine / Pancreatic System",
    howItWorks: "Stimulates pancreatic beta cells to release insulin after meals.",
    monitoredLabs: ["Fasting Glucose", "HbA1c", "Liver & Kidney function"],
    sideEffects: ["Mild hypoglycemia risk", "Dizziness", "Weight changes"],
    importantWarnings: ["Always carry a fast-acting glucose source as advised by your doctor."],
    whenToContactDoctor: ["Symptoms of low blood glucose (shakiness, sweating, confusion) that persist"]
  },
  lisinopril: {
    purpose: "Blood pressure regulation and kidney protection in metabolic conditions.",
    systemAffected: "Cardiovascular & Renal Systems",
    howItWorks: "Relaxes blood vessels by inhibiting ACE enzymes to promote healthy blood pressure.",
    monitoredLabs: ["Blood Pressure", "Serum Potassium", "Serum Creatinine"],
    sideEffects: ["Dry persistent cough", "Dizziness when standing"],
    importantWarnings: ["Do not discontinue without consulting your prescribing clinician."],
    whenToContactDoctor: ["Swelling of face/lips/tongue or lightheadedness"]
  },
  atorvastatin: {
    purpose: "Lipid management and cardiovascular protection.",
    systemAffected: "Cardiovascular & Hepatic Systems",
    howItWorks: "Inhibits HMG-CoA reductase in the liver to optimize cholesterol balance.",
    monitoredLabs: ["Lipid Profile (LDL, HDL, Triglycerides)", "Liver Enzymes (ALT/AST)"],
    sideEffects: ["Mild muscle stiffness", "Mild indigestion"],
    importantWarnings: ["Report severe unexplained muscle soreness promptly to your clinician."],
    whenToContactDoctor: ["Unexplained severe muscle aches or dark urine"]
  }
};

export function MedicationInsightsSection() {
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedicines() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<UserMedicine[]>("/medical-history/medicines");
        setMedicines(Array.isArray(data) ? data : []);
      } catch {
        setMedicines([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadMedicines();
  }, []);

  const getKnowledge = (name: string): typeof MEDICATION_KNOWLEDGE_BASE["metformin"] => {
    const clean = name.toLowerCase().trim();
    for (const key of Object.keys(MEDICATION_KNOWLEDGE_BASE)) {
      if (clean.includes(key)) {
        return MEDICATION_KNOWLEDGE_BASE[key]!;
      }
    }
    // Generic fallback for unlisted medications
    return {
      purpose: "Prescribed health medication recorded in your care profile.",
      systemAffected: "Systemic / Targeted Body System",
      howItWorks: "Acts according to its pharmacological class as prescribed by your clinician.",
      monitoredLabs: ["Routine Blood Work", "Target Health Vitals"],
      sideEffects: ["Refer to your official pharmacy medication guide for specific side effect lists."],
      importantWarnings: ["Take exactly as instructed by your healthcare professional."],
      whenToContactDoctor: ["If you experience allergic reactions, severe side effects, or feel unwell."]
    };
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-md space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-xs">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Medication Insights</h2>
            <p className="text-[11px] font-semibold text-gray-400">Information on your logged medicines</p>
          </div>
        </div>
        <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">
          Safety Reference
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs font-semibold text-gray-400 animate-pulse">
          Loading medication insights...
        </div>
      ) : medicines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-5 text-center space-y-1.5">
          <Pill className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-800">No active medications logged</h3>
          <p className="text-[11px] font-medium text-gray-500 max-w-xs mx-auto">
            When you add current medications in your profile or onboarding, authoritative safety details and lab monitoring guidance will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {medicines.map((med) => {
            const info = getKnowledge(med.name);
            const isExpanded = expandedMedId === med.id;

            return (
              <div
                key={med.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 space-y-3 shadow-2xs hover:border-teal-200 transition-all"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-teal-700 tracking-wider">
                      Recorded Medication
                    </span>
                    <h3 className="text-sm font-extrabold text-gray-900">{med.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-gray-500">
                      {med.dosage ? <span>Dose: {med.dosage}</span> : null}
                      {med.frequency ? <span>• {med.frequency}</span> : null}
                      {med.startDate ? (
                        <span>• Started: {new Date(med.startDate).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-2xs">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Always-Visible Purpose */}
                <div className="rounded-xl bg-white p-2.5 text-xs space-y-1 border border-gray-100">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-teal-600" />
                    What this medicine is commonly used for:
                  </p>
                  <p className="text-gray-600 font-medium leading-relaxed pl-5">{info.purpose}</p>
                </div>

                {/* Expanded Details */}
                {isExpanded ? (
                  <div className="space-y-3 pt-1 border-t border-gray-200/80 animate-in fade-in duration-150">
                    {/* How it Works & System */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-800">How it generally works:</p>
                      <p className="text-gray-600 font-medium leading-relaxed">{info.howItWorks}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                        Body / System Affected: {info.systemAffected}
                      </p>
                    </div>

                    {/* Monitored Measurements */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-teal-600" />
                        What health measurements may be monitored:
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {info.monitoredLabs.map((lab, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800"
                          >
                            {lab}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Side Effects */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-gray-800">Commonly reported side effects:</p>
                      <ul className="list-disc list-inside text-gray-600 font-medium space-y-0.5 pl-1">
                        {info.sideEffects.map((se, i) => (
                          <li key={i}>{se}</li>
                        ))}
                      </ul>
                    </div>

                    {/* When to Contact Doctor */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Stethoscope className="h-3.5 w-3.5 text-amber-700" />
                        When to contact a healthcare professional:
                      </p>
                      <ul className="list-disc list-inside font-medium space-y-0.5 pl-1 text-[11px]">
                        {info.whenToContactDoctor.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* Observed Data Trend Explanation Sample */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">Observational Data Note:</p>
            <p className="leading-relaxed">
              Example comparison: If glucose averages show a change after a medication is logged in your profile, V-Cure displays: <em>"Your logged data shows a change after the medication was recorded. This does not establish causation."</em>
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-900 flex items-start gap-2.5 font-medium">
        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-snug">
          V-Cure provides medication information for general reference only. Never alter, stop, or start any medication or dosage without direct explicit guidance from your prescribing physician.
        </p>
      </div>
    </div>
  );
}
