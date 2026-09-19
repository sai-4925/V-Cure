"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Plus, TrendingUp, TrendingDown, Minus, AlertCircle, Info, Calendar } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LogReadingModal } from "@/components/dashboard/log-reading-modal";
import {
  healthMonitoringService,
  type HealthMetricType,
  type HealthReadingItem
} from "@/services/health-monitoring-service";

export default function HealthMonitoringDetailPage() {
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

  // Calculations based strictly on actual logged readings
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

  // Non-diagnostic clinical observation flag
  let statusBadge: { text: string; color: string } | null = null;
  if (latestReading) {
    if (activeMetric === "BLOOD_GLUCOSE") {
      if (latestReading.context === "FASTING" && latestReading.value > 125) {
        statusBadge = { text: "Elevated Fasting Glucose", color: "bg-amber-100 text-amber-900 border-amber-200" };
      } else if (latestReading.context === "POST_MEAL" && latestReading.value > 180) {
        statusBadge = { text: "Elevated Post-Meal Glucose", color: "bg-amber-100 text-amber-900 border-amber-200" };
      } else if (latestReading.value < 70) {
        statusBadge = { text: "Low Glucose Reading", color: "bg-amber-100 text-amber-900 border-amber-200" };
      }
    } else if (activeMetric === "HBA1C") {
      if (latestReading.value >= 6.5) {
        statusBadge = { text: "Elevated HbA1c Level", color: "bg-amber-100 text-amber-900 border-amber-200" };
      }
    } else if (activeMetric === "BLOOD_PRESSURE") {
      if (latestReading.value >= 140 || (latestReading.secondaryValue && latestReading.secondaryValue >= 90)) {
        statusBadge = { text: "Elevated Blood Pressure", color: "bg-amber-100 text-amber-900 border-amber-200" };
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Container className="max-w-md px-4 py-5 space-y-5">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 shadow-xs hover:bg-gray-100 transition-all"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Health Monitoring</h1>
              <p className="text-xs font-medium text-gray-500">Log & track your health vitals</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log</span>
          </button>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`rounded-2xl px-4 py-2 text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeMetric === m.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 p-3 shadow-xs">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-600" />
            RANGE:
          </span>
          <div className="flex gap-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeRangeDays(days)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
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

        {/* Main Content Card */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-semibold text-gray-400 animate-pulse bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            Loading health readings...
          </div>
        ) : readings.length === 0 ? (
          /* REQUIREMENT 4: Empty State for New User with No Readings */
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center space-y-3 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No health readings yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Start tracking your health by logging your first reading. Recorded vitals will appear here with exact timestamps.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Log Reading</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Latest Reading Card */}
              <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-1 shadow-sm">
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
                  <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    {latestReading.context}
                  </span>
                ) : null}
              </div>

              {/* Range Average Card */}
              <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-1 shadow-sm">
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
              <div className={`rounded-2xl p-3 text-xs font-bold flex items-center gap-2 border ${statusBadge.color}`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Observation: {statusBadge.text}</span>
              </div>
            ) : null}

            {/* REQUIREMENT 2 & 3: Recent Logs with Actual Logged Dates (No Fake Interpolation) */}
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Recent Logs ({readings.length} Recorded)
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {timeRangeDays} days monitored
                </span>
              </div>

              <div className="space-y-2">
                {readings.map((r) => {
                  const formattedDate = new Date(r.recordedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">
                            {r.value} {r.secondaryValue ? `/${r.secondaryValue}` : ""} {r.unit}
                          </span>
                          {r.context ? (
                            <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                              {r.context}
                            </span>
                          ) : null}
                        </div>
                        {r.notes ? (
                          <p className="text-[11px] text-gray-500 font-medium">{r.notes}</p>
                        ) : null}
                      </div>

                      <span className="text-[11px] font-semibold text-gray-500 shrink-0 ml-2">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Clinical Guidance Disclaimer */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-[11px] text-blue-900 flex items-start gap-2.5 font-medium leading-relaxed">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            V-Cure records and tracks readings for personal health logging. Monitoring frequency and target ranges should be guided by your healthcare professional.
          </p>
        </div>

        {/* Log Reading Modal */}
        <LogReadingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onReadingAdded={fetchReadings}
        />
      </Container>
    </div>
  );
}
