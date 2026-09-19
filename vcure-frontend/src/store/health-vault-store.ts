import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExtractedBiomarker, OCRStatus } from "@/types/onboarding";
import { apiClient } from "@/lib/api-client";

export type VaultDocumentType =
  | "BLOOD_TEST"
  | "HBA1C"
  | "DIABETES"
  | "BP"
  | "SCAN"
  | "HOSPITAL"
  | "PRESCRIPTION"
  | "INSURANCE"
  | "OTHER";

export interface InsuranceMetadata {
  provider: string;
  policyName: string;
  policyNumber?: string;
  policyHolder?: string;
  startDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  coverageDetails?: string;
  supportNumber?: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  type: VaultDocumentType;
  customTypeLabel?: string;
  uploadDate: string;
  hospitalLabName?: string;
  reportDate?: string;
  ocrStatus: OCRStatus;
  extractedBiomarkers?: ExtractedBiomarker[];
  insuranceDetails?: InsuranceMetadata;
  storagePath?: string;
  storageUrl?: string;
  fileUrl?: string;
  isConfirmed: boolean;
}

interface HealthVaultState {
  documents: VaultDocument[];
  fetchDocuments: () => Promise<void>;
  addDocumentFile: (
    file: File,
    category: VaultDocumentType,
    hospitalLabName?: string,
    reportDate?: string,
    customTypeLabel?: string
  ) => Promise<VaultDocument | null>;
  addDocument: (doc: Omit<VaultDocument, "id">) => Promise<void>;
  confirmDocument: (id: string, updatedBiomarkers?: ExtractedBiomarker[], updatedReportDate?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const initialDocuments: VaultDocument[] = [];

export const useHealthVaultStore = create<HealthVaultState>()(
  persist(
    (set, get) => ({
      documents: initialDocuments,

      fetchDocuments: async () => {
        try {
          const res = await fetch("/api/medical-reports");
          if (res.ok) {
            const body = await res.json();
            if (body.success && Array.isArray(body.data)) {
              set({ documents: body.data });
            }
          }
        } catch {
          // Graceful fallback to client store persistence
        }
      },

      addDocumentFile: async (file, category, hospitalLabName, reportDate, customTypeLabel) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", category);
          if (hospitalLabName) formData.append("hospitalLabName", hospitalLabName);
          if (reportDate) formData.append("reportDate", reportDate);
          if (customTypeLabel) formData.append("customTypeLabel", customTypeLabel);

          const res = await fetch("/api/medical-reports", {
            method: "POST",
            body: formData
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "File upload failed.");
          }

          const body = await res.json();
          if (body.success && body.data) {
            const newDoc: VaultDocument = body.data;
            set((state) => ({ documents: [newDoc, ...state.documents] }));
            return newDoc;
          }
          return null;
        } catch (error) {
          console.error("Health Vault file upload error:", error);
          throw error;
        }
      },

      addDocument: async (doc) => {
        const newDoc: VaultDocument = {
          ...doc,
          id: `vault-${Date.now()}`
        };
        set((state) => ({ documents: [newDoc, ...state.documents] }));

        try {
          await apiClient.post("/medical-reports", newDoc);
        } catch {
          // Graceful fallback
        }
      },

      confirmDocument: async (id, updatedBiomarkers, updatedReportDate) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isConfirmed: true,
                  ocrStatus: "COMPLETED" as OCRStatus,
                  extractedBiomarkers: updatedBiomarkers || d.extractedBiomarkers,
                  reportDate: updatedReportDate || d.reportDate
                }
              : d
          )
        }));

        try {
          await apiClient.patch(`/medical-reports/${id}/confirm`, { updatedBiomarkers });
        } catch {
          // Graceful fallback
        }
      },

      deleteDocument: async (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id)
        }));

        try {
          await apiClient.delete(`/medical-reports/${id}`);
        } catch {
          // Graceful fallback
        }
      }
    }),
    {
      name: "vcure-health-vault",
      partialize: (state) => ({ documents: state.documents })
    }
  )
);
