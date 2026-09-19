"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMedicalContext } from "@/hooks/use-ai-chat";

export function MedicalContextPanel() {
  const { data, isLoading, isError } = useMedicalContext();

  if (isLoading) return <div className="h-32 animate-pulse rounded-card bg-surface-muted" />;
  if (isError || !data) return <p className="text-sm text-danger">Couldn&apos;t load medical context.</p>;

  const hasAny = data.conditions.length + data.allergies.length + data.medications.length > 0;

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
        What the AI sees
      </h2>

      {!hasAny ? (
        <p className="mt-3 text-sm text-text-secondary">
          Add your medical profile so responses can account for it.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {data.conditions.length > 0 ? (
            <div>
              <p className="text-xs text-text-secondary">Conditions</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.conditions.map((c) => (
                  <Badge key={c} variant="neutral">{c}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {data.allergies.length > 0 ? (
            <div className="rounded-lg border border-red-100 bg-red-50/50 p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold text-red-900">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Active Allergies (Guarded)
                </span>
                <Link
                  href="/profile"
                  className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Edit
                </Link>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {data.allergies.map((a) => (
                  <Badge key={a} variant="secondary" className="bg-red-100/90 text-red-900 border-red-200">
                    🛡️ {a}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-red-700/80">
                Bot strictly excludes these ingredients from all meal recommendations & diet orders.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>No allergies registered</span>
              <Link href="/profile" className="text-[11px] font-medium text-emerald-700 hover:underline">
                + Add in Profile
              </Link>
            </div>
          )}
          {data.medications.length > 0 ? (
            <div>
              <p className="text-xs text-text-secondary">Medications</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.medications.map((m) => (
                  <Badge key={m} variant="neutral">{m}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
