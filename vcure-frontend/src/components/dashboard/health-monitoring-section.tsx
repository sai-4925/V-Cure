"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Plus, TrendingUp, TrendingDown, Minus, AlertCircle, Info, Calendar } from "lucide-react";
import { LogReadingModal } from "./log-reading-modal";
import {
  healthMonitoringService,
  type HealthMetricType,
  type HealthReadingItem
} from "@/services/health-monitoring-service";

export function HealthMonitoringSection() {
  const [activeMetric, setActiveMetric] = useState<HealthMetricType>("BLOOD_GLUCOSE");
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [readings, setReadings] = useState<HealthReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchReadings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await healthMonitoringService.getReadings({
        metricType: activeMetric,
        days: timeRangeDays
      });
      setReadings(Array.isArray(data) ? data : []);
    } catch {
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeMetric, timeRangeDays]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Calculations for average, latest, trend, and abnormal flags
  const latestReading = readings.length > 0 ? readings[0] : null;
  const oldestReading = readings.length > 1 ? readings[readings.length - 1] : null;

  const averageValue = readings.length > 0
    ? (readings.reduce((sum, r) => sum + r.value, 0) / readings.length).toFixed(1)
    : null;

  let trendDirection: "UP" | "DOWN" | "STABLE" = "STABLE";
  let changeAmount = 0;
  if (latestReading && oldestReading) {
    const diff = latestReading.value - oldestReading.value;
    if (Math.abs(diff) > 0.5) {
      trendDirection = diff > 0 ? "UP" : "DOWN";
      changeAmount = Math.abs(diff);
    }
  }

  // Clinical indication check (Non-diagnostic, for informative flag only)
  let statusBadge: { text: string; color: string } | null = null;
  if (latestReading) {
    if (activeMetric === "BLOOD_GLUCOSE") {
      if (latestReading.context === "FASTING" && latestReading.value > 125) {
        statusBadge = { text: "Elevated Fasting", color: "bg-amber-100 text-amber-800" };
      } else if (latestReading.context === "POST_MEAL" && latestReading.value > 180) {
        statusBadge = { text: "Elevated Post-Meal", color: "bg-amber-100 text-amber-800" };
      } else if (latestReading.value < 70) {
        statusBadge = { text: "Low Reading", color: "bg-amber-100 text-amber-800" };
      }
    } else if (activeMetric === "HBA1C") {
      if (latestReading.value >= 6.5) {
        statusBadge = { text: "Elevated HbA1c", color: "bg-amber-100 text-amber-800" };
      }
    } else if (activeMetric === "BLOOD_PRESSURE") {
      if (latestReading.value >= 140 || (latestReading.secondaryValue && latestReading.secondaryValue >= 90)) {
        statusBadge = { text: "Elevated BP", color: "bg-amber-100 text-amber-800" };
      }
    }
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-md space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Health Monitoring</h2>
            <p className="text-[11px] font-semibold text-gray-400">Log & track your health vitals</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log</span>
        </button>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "BLOOD_GLUCOSE", label: "Glucose" },
          { id: "HBA1C", label: "HbA1c" },
          { id: "BLOOD_PRESSURE", label: "Blood Pressure" },
          { id: "WEIGHT", label: "Weight" }
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveMetric(m.id as HealthMetricType)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeMetric === m.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Time Range Selector (7d, 30d, 90d) */}
      <div className="flex items-center justify-between border-t border-b border-gray-100 py-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Range:
        </span>
        <div className="flex gap-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setTimeRangeDays(days)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                timeRangeDays === days
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
          Loading health readings...
        </div>
      ) : readings.length === 0 ? (
        /* Empty State for Genuine New User */
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-bold text-gray-800">No {activeMetric.replace("_", " ").toLowerCase()} readings recorded yet</h3>
          <p className="text-[11px] text-gray-500 max-w-xs mx-auto font-medium">
            Start tracking your health numbers to view personalized averages and trend insights over time.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Log First Reading
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Latest Reading Card */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Latest Reading
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">
                  {latestReading?.value}
                  {latestReading?.secondaryValue ? `/${latestReading.secondaryValue}` : ""}
                </span>
                <span className="text-xs font-bold text-gray-500">{latestReading?.unit}</span>
              </div>
              {latestReading?.context ? (
                <span className="inline-block rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  {latestReading.context}
                </span>
              ) : null}
            </div>

            {/* Average & Trend Card */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                {timeRangeDays}D Average
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{averageValue}</span>
                <span className="text-xs font-bold text-gray-500">{latestReading?.unit}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {trendDirection === "UP" ? (
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +{changeAmount.toFixed(1)} change
                  </span>
                ) : trendDirection === "DOWN" ? (
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <TrendingDown className="h-3 w-3" /> -{changeAmount.toFixed(1)} change
                  </span>
                ) : (
                  <span className="text-gray-500 flex items-center gap-0.5">
                    <Minus className="h-3 w-3" /> Stable trend
                  </span>
                )}
              </div>
            </div>
          </div>

          {statusBadge ? (
            <div className={`rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 ${statusBadge.color}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Observation: {statusBadge.text}</span>
            </div>
          ) : null}

          {/* Recent Reading List */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
              Recent Logs ({readings.length})
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {readings.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 text-xs shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">
                      {r.value} {r.secondaryValue ? `/${r.secondaryValue}` : ""} {r.unit}
                    </span>
                    {r.context ? (
                      <span className="ml-2 text-[10px] font-semibold text-gray-500 uppercase">
                        ({r.context})
                      </span>
                    ) : null}
                    {r.notes ? (
                      <p className="text-[10px] text-gray-400 font-medium">{r.notes}</p>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {new Date(r.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Guidance Disclaimer */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] text-blue-900 flex items-start gap-2.5 font-medium">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          V-Cure records and tracks readings for personal health logging. Monitoring frequency and targets should be guided by your healthcare professional.
        </p>
      </div>

      {/* Log Modal */}
      <LogReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReadingAdded={fetchReadings}
      />
    </div>
  );
}
