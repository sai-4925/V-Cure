"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightbulb,
  History,
  Stethoscope,
  X,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { VCureSymbolLogo } from "@/components/ui/vcure-logo";
import { useTranslation } from "@/hooks/use-translation";
import {
  useConversations,
  useConversation,
  useSendMessage,
  useCreateConversation
} from "@/hooks/use-ai-chat";
import { useAiChatStore } from "@/store/ai-chat-store";
import { ChatMessageList } from "@/components/ai-chat/chat-message-list";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { ConversationSidebar } from "@/components/ai-chat/conversation-sidebar";
import { SuggestedQuestions } from "@/components/ai-chat/suggested-questions";
import { QuickPrompts } from "@/components/ai-chat/quick-prompts";
import { MedicalContextPanel } from "@/components/ai-chat/medical-context-panel";
import { NutritionContextPanel } from "@/components/ai-chat/nutrition-context-panel";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";
import type { AttachedReport } from "@/types/ai-chat";

const SUGGESTED_PROMPTS_EN = [
  "I have a fever, what should I do?",
  "Best breakfast for diabetes?",
  "Healthy snack under ₹50",
  "Can I eat mango with PCOS?",
  "How much water should I drink?",
  "Explain glycemic index in simple words"
];

const SUGGESTED_PROMPTS_TE = [
  "నాకు జ్వరం ఉంది, నేను ఏమి చేయాలి?",
  "డయాబెటిస్ బాధితులకు ఉత్తమ అల్పాహారం ఏది?",
  "₹50 లోపు ఆరోగ్యకరమైన స్నాక్",
  "తాగవలసిన నీటి పరిమాణం ఎంత?",
  "గ్లైసెమిక్ ఇండెక్స్ గురించి చెప్పండి"
];

export default function CoachPage() {
  const { t, language } = useTranslation();
  const isTelugu = language === "te";

  const { data: conversations } = useConversations();
  const activeConversationId = useAiChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useAiChatStore((state) => state.setActiveConversationId);
  const streamingText = useAiChatStore((state) => state.streamingText);
  const isStreaming = useAiChatStore((state) => state.isStreaming);

  const createConversation = useCreateConversation();
  const { data: currentConversation, isLoading: isLoadingConversation } = useConversation(activeConversationId);
  const sendMessageMutation = useSendMessage(activeConversationId);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      const firstId = conversations[0]?.id;
      if (firstId) {
        setActiveConversationId(firstId);
      }
    }
  }, [activeConversationId, conversations, setActiveConversationId]);

  const suggestedPrompts = isTelugu ? SUGGESTED_PROMPTS_TE : SUGGESTED_PROMPTS_EN;

  const handleSendPrompt = async (
    text: string,
    followUpAnswers?: FollowUpAnswer[],
    attachedReport?: AttachedReport
  ) => {
    if (!text.trim() && (!followUpAnswers || followUpAnswers.length === 0) && !attachedReport) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv = await createConversation.mutateAsync();
      targetConvId = newConv.id;
      setActiveConversationId(newConv.id);
    }

    sendMessageMutation.mutate({ content: text, followUpAnswers, attachedReport });
  };

  const handleFollowUpSubmit = (answers: FollowUpAnswer[]) => {
    const reportAnswer = answers.find((a) => a.file);
    const summary = answers.map((a) => `${a.question}: ${a.value}`).join(", ");
    handleSendPrompt(summary, answers, reportAnswer?.file);
  };

  const handleRetry = () => {
    if (!currentConversation?.messages?.length) return;
    const lastUserMsg = [...currentConversation.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      sendMessageMutation.mutate({ content: lastUserMsg.content });
    }
  };

  const messages = currentConversation?.messages || [];

  return (
    <div className="relative flex flex-col h-full bg-gray-50 min-w-0 w-full overflow-hidden">
      {/* Top Header */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-2.5 shadow-xs z-30">
        <Container className="max-w-md px-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 p-1.5 border border-emerald-100 shadow-xs shrink-0">
              <VCureSymbolLogo className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-gray-900 truncate">
                  {t.coachTitle}
                </h1>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-gray-400 truncate">
                {t.coachSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* History Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen((prev) => !prev);
                setIsContextOpen(false);
              }}
              aria-label="Conversation History"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                isHistoryOpen
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <History className="h-4 w-4" />
            </button>

            {/* Health Context Peek */}
            <button
              type="button"
              onClick={() => {
                setIsContextOpen((prev) => !prev);
                setIsHistoryOpen(false);
              }}
              aria-label="Medical and Nutrition Context"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                isContextOpen
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
            </button>

            {/* Profile link */}
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-xs hover:bg-slate-700 transition-all"
              aria-label="Profile"
            >
              S
            </Link>
          </div>
        </Container>
      </div>

      {/* Main Messages & Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-w-0 w-full">
        <Container className="max-w-md px-0 flex flex-col h-full">
          {isLoadingConversation ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>Loading conversation...</span>
              </div>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="space-y-4 py-2">
              {/* Welcome Green Banner */}
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 text-center shadow-xs">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-base font-extrabold text-gray-900">
                  {isTelugu ? "నమస్కారం! నేను మీ ఆహార ప్రణాళిక కోచ్." : "Hi! I'm your V-Cure health coach."}
                </h2>
                <p className="mt-1 text-xs font-medium text-gray-600 leading-relaxed">
                  {isTelugu
                    ? "ఆహారం, అలవాట్లు లేదా మీ ఆరోగ్య ప్రొఫైల్ ఆధారిత సలహాల గురించి నన్ను అడగండి."
                    : "Ask about safe personalized recipes, diabetes nutrition, low-cost regional meals, or symptom guidance."}
                </p>

                {/* Quick Prompts List */}
                <div className="mt-4 space-y-1.5">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendPrompt(prompt)}
                      className="w-full flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-gray-800 shadow-xs hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorized Quick Prompts */}
              <QuickPrompts onSelect={(prompt) => handleSendPrompt(prompt)} />
            </div>
          ) : (
            <ChatMessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingText={streamingText}
              onRetry={handleRetry}
              onFollowUpSubmit={handleFollowUpSubmit}
            />
          )}
        </Container>
      </div>

      {/* Slide-over Drawer: History & Conversations */}
      {isHistoryOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end sm:justify-start">
          <div className="h-[80%] sm:h-full bg-white rounded-t-3xl sm:rounded-none p-4 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Conversations</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close conversation drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-2" onClick={() => setIsHistoryOpen(false)}>
              <ConversationSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer: Medical & Nutrition Context */}
      {isContextOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end sm:justify-start">
          <div className="h-[85%] sm:h-full bg-white rounded-t-3xl sm:rounded-none p-4 flex flex-col shadow-2xl overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Active Health Context</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsContextOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close health context drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <MedicalContextPanel />
            <NutritionContextPanel />
          </div>
        </div>
      )}

      {/* Pinned Bottom Input & Suggested Questions */}
      <div className="shrink-0 bg-white border-t border-gray-100 p-3 shadow-lg z-30">
        <Container className="max-w-md px-0 space-y-2">
          {messages.length > 0 && (
            <SuggestedQuestions onSelect={(prompt) => handleSendPrompt(prompt)} />
          )}
          <ChatInput
            onSend={(content, attachedReport) => handleSendPrompt(content, undefined, attachedReport)}
            disabled={isStreaming || sendMessageMutation.isPending}
          />
        </Container>
      </div>
    </div>
  );
}

