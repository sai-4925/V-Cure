"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttachedReport } from "@/types/ai-chat";

const MAX_LENGTH = 1000;

export function ChatInput({
  onSend,
  disabled
}: {
  onSend: (content: string, attachedReport?: AttachedReport) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [attachedReport, setAttachedReport] = useState<AttachedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedReport({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0 && !attachedReport) {
      setError("Type a message or attach a report before sending.");
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Keep messages under ${MAX_LENGTH} characters.`);
      return;
    }
    setError(null);
    onSend(trimmed || `Attached medical report: ${attachedReport?.name}`, attachedReport || undefined);
    setValue("");
    setAttachedReport(null);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border pt-2.5">
      {/* Attached Report Preview Pill */}
      {attachedReport && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate">{attachedReport.name}</span>
            <span className="text-[10px] text-emerald-700/80">
              ({(attachedReport.size / 1024).toFixed(0)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedReport(null)}
            className="rounded-full p-1 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
            aria-label="Remove attached report"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        {/* Hidden File Input & Attach Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach optional medical report (PDF or Image)"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0 disabled:opacity-50"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            rows={1}
            placeholder="Ask about fever, temperature, recipes, or health guidance..."
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "chat-input-error" : undefined}
            className="max-h-32 w-full resize-none rounded-input border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus-visible:border-primary disabled:opacity-60"
          />
        </div>
        <Button type="submit" size="md" disabled={disabled}>
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p id="chat-input-error" role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
