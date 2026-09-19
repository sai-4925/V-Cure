"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, ArrowLeft, Trash2, Calendar, ExternalLink, Filter } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useHealthVaultStore, type VaultDocumentType, type VaultDocument } from "@/store/health-vault-store";
import { checkReportQuality } from "@/lib/report-quality-checker";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import type { ExtractedBiomarker } from "@/types/onboarding";

const REPORT_TYPE_OPTIONS: { value: VaultDocumentType; label: string }[] = [
  { value: "BLOOD_TEST", label: "Blood Test" },
  { value: "HBA1C", label: "HbA1c" },
  { value: "DIABETES", label: "Diabetes Profile" },
  { value: "BP", label: "Blood Pressure / Cardiac" },
  { value: "SCAN", label: "Scan / Radiology" },
  { value: "HOSPITAL", label: "Hospital Discharge Summary" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "OTHER", label: "Other Medical Report" }
];

export default function ReportsPage() {
  useSwipeBack("/dashboard");
  const documents = useHealthVaultStore((state) => state.documents);
  const fetchDocuments = useHealthVaultStore((state) => state.fetchDocuments);
  const addDocumentFile = useHealthVaultStore((state) => state.addDocumentFile);
  const confirmDocument = useHealthVaultStore((state) => state.confirmDocument);
  const deleteDocument = useHealthVaultStore((state) => state.deleteDocument);
  const updateGlucoseLabs = useOnboardingStore((state) => state.updateGlucoseLabs);

  const [selectedType, setSelectedType] = useState<VaultDocumentType>("BLOOD_TEST");
  const [customLabel, setCustomLabel] = useState("");
  const [manualReportDate, setManualReportDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter out insurance documents (insurance has its own page) and sort chronologically by reportDate/uploadDate
  const reportDocs = documents
    .filter((d) => d.type !== "INSURANCE")
    .filter((d) => (filterType === "ALL" ? true : d.type === filterType))
    .sort((a, b) => {
      const dateA = new Date(a.reportDate || a.uploadDate).getTime();
      const dateB = new Date(b.reportDate || b.uploadDate).getTime();
      return dateB - dateA;
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      // 1. Quality Check
      const quality = await checkReportQuality(file);
      if (!quality.isReadable) {
        setIsUploading(false);
        setErrorMsg(quality.message);
        return;
      }

      // 2. Upload file to backend & storage
      const reportDate = manualReportDate || new Date().toISOString().split("T")[0];
      await addDocumentFile(file, selectedType, "Metropolis Diagnostics", reportDate, customLabel || undefined);
      setIsUploading(false);
      setCustomLabel("");
      setManualReportDate("");
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err?.message || "Failed to upload document file.");
    }
  };

  const handleConfirmReport = async (doc: VaultDocument) => {
    await confirmDocument(doc.id, doc.extractedBiomarkers, doc.reportDate);
    if (doc.extractedBiomarkers) {
      const hba1c = doc.extractedBiomarkers.find((b) => b.name === "HbA1c");
      const fasting = doc.extractedBiomarkers.find((b) => b.name.includes("Fasting"));
      if (hba1c || fasting) {
        updateGlucoseLabs({
          hba1cPercent: hba1c ? parseFloat(hba1c.value) : 6.1,
          fastingGlucoseMgDl: fasting ? parseFloat(fasting.value) : 110,
          dontKnowWillUploadReport: false
        });
      }
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm("Are you sure you want to remove this medical report from your vault?")) {
      await deleteDocument(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 shadow-xs">
        <Container className="max-w-md flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">Health Reports</h1>
          <div className="w-9" />
        </Container>
      </div>

      <Container className="max-w-md px-4 py-5 space-y-5">
        {/* Banner */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-emerald-950">Medical Record & Biomarker Storage</p>
            <p className="mt-0.5 leading-relaxed font-medium text-emerald-800">
              Securely store previous lab tests (PDF, JPG, PNG). Extracted biomarkers update your personalized wellness profile without non-diagnostic risk.
            </p>
          </div>
        </div>

        {/* Upload Form Box */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Upload New Report</h2>

          {/* Report Type Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Report Type / Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as VaultDocumentType)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:outline-none"
            >
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Name / Description if Other */}
          {selectedType === "OTHER" ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Specific Report Name
              </label>
              <input
                type="text"
                placeholder="e.g. Thyroid Profile, Liver Function Test"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          ) : null}

          {/* Medical Test Date Entry */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Medical Test Date (Optional)
            </label>
            <input
              type="date"
              value={manualReportDate}
              onChange={(e) => setManualReportDate(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Leave blank to automatically detect or default to today&apos;s upload date.
            </p>
          </div>

          {/* File Picker Zone */}
          <div className="relative border-2 border-dashed border-gray-200 rounded-3xl p-5 text-center bg-gray-50 hover:bg-gray-100/80 transition-all cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-2 shadow-xs">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-extrabold text-gray-900">Select Document File</p>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">PDF, JPG, JPEG, or PNG up to 10MB</p>
            </div>
          </div>

          {/* Processing Indicator */}
          {isUploading ? (
            <div className="rounded-2xl border border-gray-100 bg-emerald-50 p-3.5 text-center text-xs font-bold text-emerald-900 shadow-xs flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              Uploading to private vault & running document OCR...
            </div>
          ) : null}

          {/* Error Message */}
          {errorMsg ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}
        </div>

        {/* Existing Uploaded Reports List Header & Filter */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            Previous Health Reports ({reportDocs.length})
          </h2>

          <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-xl text-[11px] font-bold text-gray-700">
            <Filter className="h-3 w-3 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Reports</option>
              <option value="BLOOD_TEST">Blood Tests</option>
              <option value="HBA1C">HbA1c</option>
              <option value="PRESCRIPTION">Prescriptions</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {reportDocs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-2 shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No medical reports uploaded yet</h3>
              <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
                Upload your blood test, HbA1c, or lab report above to track your medical history safely.
              </p>
            </div>
          ) : (
            reportDocs.map((doc) => {
              const displayDate = doc.reportDate || "Report date not detected";

              return (
                <div key={doc.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-900 truncate max-w-[180px]">
                          {doc.customTypeLabel || doc.name}
                        </h3>
                        <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Test Date: {displayDate}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                          Uploaded: {doc.uploadDate} • {doc.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {doc.isConfirmed ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Confirmed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmReport(doc)}
                          className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 hover:bg-amber-200 transition-all"
                        >
                          Review & Sync
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteReport(doc.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-all"
                        aria-label="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document View / Storage Link */}
                  {doc.storageUrl || doc.fileUrl ? (
                    <a
                      href={doc.storageUrl || doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline bg-emerald-50/80 px-2.5 py-1 rounded-xl"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Original Document
                    </a>
                  ) : null}

                  {/* Extracted Biomarkers Section */}
                  {doc.extractedBiomarkers && doc.extractedBiomarkers.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Extracted Document Biomarkers:
                      </p>
                      {doc.extractedBiomarkers.map((bm, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl">
                          <span className="font-semibold text-gray-800">{bm.name}</span>
                          <span className={`font-bold ${bm.isAbnormal ? "text-amber-700" : "text-emerald-700"}`}>
                            {bm.value} {bm.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </Container>
    </div>
  );
}
