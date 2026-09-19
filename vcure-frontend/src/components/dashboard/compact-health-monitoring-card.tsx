"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, Plus, ChevronRight } from "lucide-react";
import { LogReadingModal } from "./log-reading-modal";
import {
  healthMonitoringService,
  type HealthReadingItem
} from "@/services/health-monitoring-service";

export function CompactHealthMonitoringCard() {
  const router = useRouter();
  const [readings, setReadings] = useState<HealthReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchReadings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await healthMonitoringService.getReadings({ days: 30 });
      setReadings(Array.isArray(data) ? data : []);
    } catch {
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const latest = readings.length > 0 ? readings[0] : null;

  const handleCardClick = () => {
    router.push("/health-monitoring");
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md flex flex-col justify-between h-[126px] cursor-pointer hover:border-emerald-300 hover:shadow-lg transition-all group relative"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] font-bold text-gray-700 group-hover:text-emerald-800 transition-colors">
              Health Monitoring
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Reading Summary / Empty State */}
        <div className="my-1">
          {isLoading ? (
            <span className="text-xs text-gray-400 font-medium">Loading...</span>
          ) : latest ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900">
                  {latest.value}
                  {latest.secondaryValue ? `/${latest.secondaryValue}` : ""}
                </span>
                <span className="text-[10px] font-bold text-gray-400">{latest.unit}</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-700 capitalize truncate">
                {latest.metricType.replace("_", " ").toLowerCase()}
                {latest.context ? ` (${latest.context.toLowerCase()})` : ""}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-lg font-black text-gray-900">0</span>
              <span className="text-[10px] font-bold text-gray-400 ml-1">readings</span>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">No readings logged yet</p>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-[10px] font-medium text-gray-500">
            {readings.length} {readings.length === 1 ? "Logged" : "Logged"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-transform hover:scale-105 cursor-pointer"
            aria-label="Log health reading"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <LogReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReadingAdded={fetchReadings}
      />
    </>
  );
}
