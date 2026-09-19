"use client";

import { useState, useEffect } from "react";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";
import type { FollowUpQuestionItem, FollowUpQuestionOption } from "@/types/ai-chat";

interface FollowUpChipsProps {
  questions: (string | FollowUpQuestionItem)[];
  required: string[];
  initialAnswers?: { question: string; value: string }[];
  onSubmit: (answers: FollowUpAnswer[]) => void;
  disabled?: boolean;
}

function normalizeItem(q: string | FollowUpQuestionItem): FollowUpQuestionItem {
  if (typeof q === "string") {
    return {
      id: q,
      label: q.charAt(0).toUpperCase() + q.slice(1),
      placeholder: `Enter ${q.toLowerCase()}...`
    };
  }
  return q;
}

function getOptionDetails(opt: string | FollowUpQuestionOption): { label: string; value: string } {
  if (typeof opt === "string") {
    return { label: opt, value: opt };
  }
  return opt;
}

export function FollowUpChips({
  questions,
  required,
  initialAnswers = [],
  onSubmit,
  disabled = false
}: FollowUpChipsProps) {
  const normalizedQuestions = questions.map(normalizeItem);
  const questionIds = normalizedQuestions.map((q) => q.id);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([...required, ...initialAnswers.map((a) => a.question)])
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    initialAnswers.reduce((acc, a) => ({ ...acc, [a.question]: a.value }), {})
  );

  // Sync selected when questions or required change
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      required.forEach((q) => next.add(q));
      const validIds = new Set(questionIds);
      next.forEach((id) => {
        if (!validIds.has(id)) next.delete(id);
      });
      return next;
    });
  }, [JSON.stringify(questionIds), JSON.stringify(required)]);

  const answeredRequiredCount = required.filter((id) => (values[id] ?? "").trim().length > 0).length;
  const progress =
    required.length > 0
      ? Math.min(100, Math.round((answeredRequiredCount / required.length) * 100))
      : 100;

  const handleToggleSelect = (id: string) => {
    if (disabled) return;
    if (required.includes(id)) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleValueChange = (id: string, value: string) => {
    if (disabled) return;
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const allRequiredAnswered =
    required.length > 0 && required.every((id) => (values[id] ?? "").trim().length > 0);

  const handleSubmit = () => {
    if (disabled) return;
    if (!allRequiredAnswered) return;

    const answers: FollowUpAnswer[] = Array.from(selected)
      .filter((id) => Boolean((values[id] ?? "").trim()))
      .map((id) => ({ question: id, value: (values[id] ?? "").trim() }));

    if (answers.length > 0) {
      onSubmit(answers);
    }
  };

  return (
    <div className="mt-3 space-y-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
      {/* Progress header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
          <span className="text-xs font-bold text-emerald-900">
            Required Details ({answeredRequiredCount}/{required.length})
          </span>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-emerald-200/60">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Field selection pills */}
      <div className="flex flex-wrap gap-1.5">
        {normalizedQuestions.map((q) => {
          const isRequired = required.includes(q.id);
          const isSelected = selected.has(q.id);
          const hasValue = Boolean((values[q.id] ?? "").trim());

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => handleToggleSelect(q.id)}
              disabled={disabled || isRequired}
              className={`group relative rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                  : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
              } ${isRequired && !hasValue ? "ring-2 ring-emerald-300/80" : ""}`}
            >
              <span>{q.label}</span>
              {isRequired ? (
                <span className="ml-1 text-[11px] text-emerald-200 font-bold">*</span>
              ) : (
                !isSelected && <span className="ml-1 text-[10px] opacity-60">+</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inputs & Options Form */}
      <div className="flex flex-col gap-3 pt-1">
        {normalizedQuestions
          .filter((q) => selected.has(q.id) || required.includes(q.id))
          .map((q) => {
            const isRequired = required.includes(q.id);
            const currentValue = values[q.id] || "";

            return (
              <div key={q.id} className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-white/85 p-3 shadow-2xs">
                {/* Question Label & Description */}
                <div className="flex items-baseline justify-between gap-2">
                  <label className="text-xs font-bold text-gray-800">
                    {q.label} {isRequired ? <span className="text-red-500 font-bold">*</span> : <span className="text-[10px] font-normal text-gray-400">(optional)</span>}
                  </label>
                  {q.unit && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Unit: {q.unit}
                    </span>
                  )}
                </div>

                {q.description && (
                  <p className="text-[11px] text-gray-500 leading-tight">
                    {q.description}
                  </p>
                )}

                {/* Pre-defined selectable option chips if available */}
                {q.options && q.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.options.map((opt) => {
                      const { label, value } = getOptionDetails(opt);
                      const isOptionActive = currentValue === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleValueChange(q.id, value)}
                          disabled={disabled}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            isOptionActive
                              ? "bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-600"
                              : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Direct text input with unit badge & examples */}
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleValueChange(q.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allRequiredAnswered) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={q.placeholder || `Enter ${q.label.toLowerCase()}...`}
                    disabled={disabled}
                    className={`w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 ${
                      q.unit ? "pr-16" : ""
                    }`}
                  />
                  {q.unit && (
                    <span className="pointer-events-none absolute right-2.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs">
                      {q.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !allRequiredAnswered}
          className="w-full rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {allRequiredAnswered
            ? "Submit answers & continue"
            : `Provide all required fields (${answeredRequiredCount}/${required.length})`}
        </button>
      </div>
    </div>
  );
}