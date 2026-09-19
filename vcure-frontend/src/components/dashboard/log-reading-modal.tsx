"use client";

import { useState } from "react";
import { X, Activity, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  healthMonitoringService,
  type HealthMetricType,
  type GlucoseContext
} from "@/services/health-monitoring-service";
import { devLogger } from "@/lib/dev-logger";

interface LogReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadingAdded: () => void;
}

export function LogReadingModal({ isOpen, onClose, onReadingAdded }: LogReadingModalProps) {
  const [metricType, setMetricType] = useState<HealthMetricType>("BLOOD_GLUCOSE");
  const [glucoseContext, setGlucoseContext] = useState<GlucoseContext>("FASTING");
  const [value, setValue] = useState<string>("");
  const [secondaryValue, setSecondaryValue] = useState<string>(""); // e.g. diastolic BP
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getUnit = (type: HealthMetricType) => {
    switch (type) {
      case "BLOOD_GLUCOSE": return "mg/dL";
      case "HBA1C": return "%";
      case "BLOOD_PRESSURE": return "mmHg";
      case "WEIGHT": return "kg";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal <= 0) {
      setError("Please enter a valid numeric value.");
      return;
    }

    let numSecondary: number | undefined = undefined;
    if (metricType === "BLOOD_PRESSURE") {
      numSecondary = parseFloat(secondaryValue);
      if (isNaN(numSecondary) || numSecondary <= 0) {
        setError("Please enter a valid diastolic blood pressure value.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await healthMonitoringService.logReading({
        metricType,
        value: numVal,
        secondaryValue: numSecondary,
        unit: getUnit(metricType),
        context: metricType === "BLOOD_GLUCOSE" ? glucoseContext : undefined,
        notes: notes.trim() || undefined,
        recordedAt: new Date().toISOString()
      });

      devLogger.log({
        action: "LOG_HEALTH_READING",
        validationResult: "SUCCESS",
        endpoint: "/health-readings",
        details: { metricType, value: numVal }
      });

      onReadingAdded();
      onClose();
    } catch (err: any) {
      devLogger.log({
        action: "LOG_HEALTH_READING_FAILED",
        responseError: err?.message || "Failed to save reading",
        endpoint: "/health-readings"
      });
      setError(err?.message || "Failed to log health reading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span className="text-sm">Log Health Metric</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600 font-medium">
              {error}
            </div>
          ) : null}

          {/* Metric Selector */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
              Select Metric
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "BLOOD_GLUCOSE", label: "Blood Glucose" },
                { id: "HBA1C", label: "HbA1c" },
                { id: "BLOOD_PRESSURE", label: "Blood Pressure" },
                { id: "WEIGHT", label: "Weight" }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetricType(m.id as HealthMetricType)}
                  className={`rounded-xl py-2 px-3 text-xs font-bold text-center border transition-all ${
                    metricType === m.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context selector for blood glucose */}
          {metricType === "BLOOD_GLUCOSE" ? (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                Glucose Context
              </label>
              <select
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value as GlucoseContext)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="FASTING">Fasting</option>
                <option value="POST_MEAL">Post-meal (2 hrs)</option>
                <option value="RANDOM">Random</option>
                <option value="BEDTIME">Bedtime</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          ) : null}

          {/* Value Inputs */}
          {metricType === "BLOOD_PRESSURE" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                  Systolic (mmHg)
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                  Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={secondaryValue}
                  onChange={(e) => setSecondaryValue(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Value ({getUnit(metricType)})
              </label>
              <input
                type="number"
                step="any"
                placeholder={metricType === "HBA1C" ? "6.2" : metricType === "WEIGHT" ? "70" : "110"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
              Optional Note
            </label>
            <input
              type="text"
              placeholder="e.g. Before breakfast, felt energetic"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-md"
            >
              Save Reading
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
