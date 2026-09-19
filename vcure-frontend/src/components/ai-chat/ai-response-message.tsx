import { Sparkles, AlertCircle, FileText, Thermometer } from "lucide-react";
import { SafetyWarningBanner } from "@/components/ai-chat/safety-warning-banner";
import { SourceReferences } from "@/components/ai-chat/source-references";
import { FollowUpChips } from "@/components/ai-chat/follow-up-chips";
import { DietOrderCard } from "@/components/ai-chat/diet-order-card";
import type { ChatMessage } from "@/types/ai-chat";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";

export function AiResponseMessage({
  message,
  onRetry,
  onFollowUpSubmit,
  isFollowUpDisabled
}: {
  message: ChatMessage;
  onRetry?: () => void;
  onFollowUpSubmit?: (answers: FollowUpAnswer[]) => void;
  isFollowUpDisabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="flex max-w-[85%] flex-col gap-2">
        {message.status === "error" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p>Something went wrong generating a response.</p>
              {onRetry ? (
                <button type="button" onClick={onRetry} className="mt-1 text-xs font-medium underline">
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white px-4 py-3 text-xs font-medium leading-relaxed text-gray-900 shadow-xs whitespace-pre-line">
            {message.content}
            {message.status === "streaming" ? (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-600 align-middle" aria-hidden="true" />
            ) : null}
          </div>
        )}

        {/* Temperature Reading Evaluation Badge */}
        {message.temperatureReading && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-950 shadow-2xs">
            <Thermometer className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px]">
                Recorded Temp: {message.temperatureReading.value} {message.temperatureReading.unit || "°F"}
              </span>
              {message.temperatureReading.classification && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    message.temperatureReading.classification === "High"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : message.temperatureReading.classification === "Moderate"
                      ? "bg-amber-200/90 text-amber-900"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {message.temperatureReading.classification}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Verified Report Review Box */}
        {message.attachedReport && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-950 shadow-2xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold truncate text-[11px]">{message.attachedReport.name}</span>
                <span className="rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[9px] font-bold text-emerald-900">
                  Reviewed
                </span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-tight">
                Correlated with clinical fever and infection biomarker standards
              </p>
            </div>
          </div>
        )}

        {message.safetyWarning ? <SafetyWarningBanner warning={message.safetyWarning} /> : null}
        {message.sources ? <SourceReferences sources={message.sources} /> : null}

        {/* Recommended Diet Items & Direct Order Card */}
        {message.dietOrder ? <DietOrderCard dietOrder={message.dietOrder} /> : null}

        {message.followUp && onFollowUpSubmit ? (
          <FollowUpChips
            questions={message.followUp.questions}
            required={message.followUp.required}
            onSubmit={onFollowUpSubmit}
            disabled={isFollowUpDisabled}
          />
        ) : null}
      </div>
    </div>
  );
}
