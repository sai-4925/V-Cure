"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ShieldCheck, Upload, ArrowLeft, Trash2, Edit3, Plus, CheckCircle2, Phone, Calendar, AlertTriangle, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useHealthVaultStore, type VaultDocument } from "@/store/health-vault-store";
import { checkReportQuality } from "@/lib/report-quality-checker";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function InsurancePage() {
  useSwipeBack("/dashboard");
  const documents = useHealthVaultStore((state) => state.documents);
  const fetchDocuments = useHealthVaultStore((state) => state.fetchDocuments);
  const addDocumentFile = useHealthVaultStore((state) => state.addDocumentFile);
  const addDocument = useHealthVaultStore((state) => state.addDocument);
  const deleteDocument = useHealthVaultStore((state) => state.deleteDocument);

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [provider, setProvider] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [policyHolder, setPolicyHolder] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [coverageDetails, setCoverageDetails] = useState("");
  const [supportNumber, setSupportNumber] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter existing insurance policies stored in Health Vault
  const insuranceDocs = documents.filter((d) => d.type === "INSURANCE");

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim() || !policyName.trim()) {
      setErrorMsg("Please enter at least the Insurance Provider and Plan Name.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0] || "2026-09-16";

    const newDoc: Omit<VaultDocument, "id"> = {
      name: `${provider} - ${policyName}`,
      type: "INSURANCE",
      uploadDate: todayStr,
      reportDate: startDate || todayStr,
      ocrStatus: "COMPLETED",
      isConfirmed: true,
      insuranceDetails: {
        provider: provider.trim(),
        policyName: policyName.trim(),
        policyNumber: policyNumber.trim() || undefined,
        policyHolder: policyHolder.trim() || undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        renewalDate: expiryDate || undefined,
        coverageDetails: coverageDetails.trim() || undefined,
        supportNumber: supportNumber.trim() || undefined
      }
    };

    await addDocument(newDoc);
    resetForm();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const quality = await checkReportQuality(file);
      if (!quality.isReadable) {
        setIsUploading(false);
        setErrorMsg(quality.message);
        return;
      }

      await addDocumentFile(file, "INSURANCE", "Health Insurance");
      setIsUploading(false);
      setIsAdding(false);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err?.message || "Failed to upload insurance policy document.");
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (confirm("Are you sure you want to remove this insurance policy record?")) {
      await deleteDocument(id);
    }
  };

  const resetForm = () => {
    setProvider("");
    setPolicyName("");
    setPolicyNumber("");
    setPolicyHolder("");
    setStartDate("");
    setExpiryDate("");
    setCoverageDetails("");
    setSupportNumber("");
    setErrorMsg(null);
    setIsAdding(false);
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
          <h1 className="text-base font-bold text-gray-900">Health Insurance</h1>
          <div className="w-9" />
        </Container>
      </div>

      <Container className="max-w-md px-4 py-5 space-y-5">
        {/* Info Card */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-emerald-950">Health Insurance Vault</p>
            <p className="mt-0.5 leading-relaxed font-medium text-emerald-800">
              Keep policy numbers, coverage details, emergency support contacts, and policy documents ready in one authenticated place.
            </p>
          </div>
        </div>

        {/* Existing Insurance Policies List */}
        {insuranceDocs.length > 0 && !isAdding ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Active Health Policies ({insuranceDocs.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Policy
              </button>
            </div>

            {insuranceDocs.map((doc) => {
              const details = doc.insuranceDetails;
              return (
                <div key={doc.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                        Health Insurance
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900 mt-1">
                        {details?.provider || doc.name}
                      </h3>
                      {details?.policyName ? (
                        <p className="text-xs font-bold text-gray-600">{details.policyName}</p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePolicy(doc.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-all"
                      aria-label="Remove insurance policy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl">
                    {details?.policyNumber ? (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Policy No.</p>
                        <p className="font-extrabold text-gray-900 font-mono mt-0.5">{details.policyNumber}</p>
                      </div>
                    ) : null}

                    {details?.policyHolder ? (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Policy Holder</p>
                        <p className="font-bold text-gray-900 mt-0.5">{details.policyHolder}</p>
                      </div>
                    ) : null}

                    {details?.expiryDate ? (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expiry / Renewal</p>
                        <p className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {details.expiryDate}
                        </p>
                      </div>
                    ) : null}

                    {details?.coverageDetails ? (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coverage</p>
                        <p className="font-bold text-gray-900 mt-0.5">{details.coverageDetails}</p>
                      </div>
                    ) : null}
                  </div>

                  {details?.supportNumber ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span>Helpline: {details.supportNumber}</span>
                    </div>
                  ) : null}

                  {/* Storage link if uploaded via document */}
                  {doc.storageUrl || doc.fileUrl ? (
                    <a
                      href={doc.storageUrl || doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline pt-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Policy Card / Document
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Empty State for Users without Insurance */}
        {insuranceDocs.length === 0 && !isAdding ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Shield className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Health Insurance</h3>
              <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
                No health insurance added yet. Store your policy number, coverage details, and policy document safely.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsAdding(true)}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Insurance
            </Button>
          </div>
        ) : null}

        {/* Add Insurance Form */}
        {isAdding ? (
          <form onSubmit={handleManualSave} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-extrabold text-gray-900">Add Health Insurance Policy</h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>

            {/* Quick Document Upload OCR */}
            <div className="relative border-2 border-dashed border-emerald-200 rounded-2xl p-4 text-center bg-emerald-50/50 hover:bg-emerald-100/50 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center">
                <Upload className="h-5 w-5 text-emerald-600 mb-1" />
                <p className="text-xs font-extrabold text-emerald-950">Upload Policy Card or Document (PDF / Image)</p>
                <p className="text-[10px] font-medium text-emerald-700">Extract policy details automatically via OCR</p>
              </div>
            </div>

            {isUploading ? (
              <div className="rounded-2xl bg-emerald-100 p-3 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                Processing policy document...
              </div>
            ) : null}

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-gray-400 uppercase">Or Fill Manually</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Insurance Provider / Company *
              </label>
              <input
                type="text"
                placeholder="e.g. Star Health, HDFC ERGO, Care Insurance"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Plan Name / Policy Type *
              </label>
              <input
                type="text"
                placeholder="e.g. Family Health Optima, Comprehensive Care"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. P/123456/01"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Policy Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Holder Name"
                  value={policyHolder}
                  onChange={(e) => setPolicyHolder(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Expiry / Renewal Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Coverage Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,00,000 Sum Insured"
                  value={coverageDetails}
                  onChange={(e) => setCoverageDetails(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Helpline Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 1800-425-2255"
                  value={supportNumber}
                  onChange={(e) => setSupportNumber(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
            >
              Save Health Insurance Policy
            </Button>
          </form>
        ) : null}
      </Container>
    </div>
  );
}
