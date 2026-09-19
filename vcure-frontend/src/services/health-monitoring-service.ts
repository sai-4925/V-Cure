import { apiClient } from "@/lib/api-client";

export type HealthMetricType = "BLOOD_GLUCOSE" | "HBA1C" | "BLOOD_PRESSURE" | "WEIGHT";
export type GlucoseContext = "FASTING" | "POST_MEAL" | "RANDOM" | "BEDTIME" | "GENERAL";

export interface CreateHealthReadingPayload {
  metricType: HealthMetricType;
  value: number;
  secondaryValue?: number;
  unit: string;
  context?: GlucoseContext;
  notes?: string;
  recordedAt?: string;
}

export interface HealthReadingItem {
  id: string;
  userId: string;
  metricType: HealthMetricType;
  value: number;
  secondaryValue?: number;
  unit: string;
  context?: GlucoseContext;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

export const healthMonitoringService = {
  logReading: (payload: CreateHealthReadingPayload) =>
    apiClient.post<HealthReadingItem>("/health-readings", payload),

  getReadings: (params?: { metricType?: HealthMetricType; days?: number }) => {
    const query = new URLSearchParams();
    if (params?.metricType) query.append("metricType", params.metricType);
    if (params?.days) query.append("days", params.days.toString());
    const queryString = query.toString();
    return apiClient.get<HealthReadingItem[]>(
      `/health-readings${queryString ? `?${queryString}` : ""}`
    );
  }
};
