import { Sparkles, AlertCircle } from "lucide-react";
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
          <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white px-4 py-3 text-xs font-medium leading-relaxed text-gray-900 shadow-xs">
            {message.content}
            {message.status === "streaming" ? (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-600 align-middle" aria-hidden="true" />
            ) : null}
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
