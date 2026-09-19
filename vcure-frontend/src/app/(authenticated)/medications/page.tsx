"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { MedicationInsightsSection } from "@/components/medications/medication-insights";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function MedicationsPage() {
  useSwipeBack("/dashboard");

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
          <h1 className="text-base font-bold text-gray-900">Medication Insights</h1>
          <div className="w-9" />
        </Container>
      </div>

      <Container className="max-w-md px-4 py-5 space-y-5">
        <MedicationInsightsSection />
      </Container>
    </div>
  );
}
