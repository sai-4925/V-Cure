import { FileText, Thermometer } from "lucide-react";
import type { ChatMessage } from "@/types/ai-chat";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-600 px-4 py-3 text-xs font-medium text-white shadow-xs space-y-2">
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {/* Temperature Reading Badge if recorded */}
        {message.temperatureReading && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/80 px-2.5 py-1 text-[11px] font-bold text-white border border-emerald-500/60 shadow-2xs">
            <Thermometer className="h-3.5 w-3.5 text-emerald-200" />
            <span>Temperature: {message.temperatureReading.value} {message.temperatureReading.unit || "°F"}</span>
            {message.temperatureReading.classification && (
              <span className="ml-1 rounded-full bg-emerald-900/50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-200">
                {message.temperatureReading.classification}
              </span>
            )}
          </div>
        )}

        {/* Attached Report File Card if present */}
        {message.attachedReport && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-700/70 p-2 text-white border border-emerald-500/40">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-emerald-200 shrink-0">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 truncate">
              <p className="text-[11px] font-bold truncate">{message.attachedReport.name}</p>
              <p className="text-[10px] text-emerald-200">
                {(message.attachedReport.size / 1024).toFixed(0)} KB • Lab Report
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
