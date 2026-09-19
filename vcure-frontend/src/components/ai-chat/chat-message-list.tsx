"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { UserMessage } from "@/components/ai-chat/user-message";
import { AiResponseMessage } from "@/components/ai-chat/ai-response-message";
import { TypingIndicator } from "@/components/ai-chat/typing-indicator";
import type { ChatMessage } from "@/types/ai-chat";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";

export function ChatMessageList({
  messages,
  isStreaming,
  streamingText,
  onRetry,
  onFollowUpSubmit
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string | null;
  onRetry?: () => void;
  onFollowUpSubmit?: (answers: FollowUpAnswer[]) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingText]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <MessageCircle className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        <p className="text-sm text-text-secondary">
          Ask about your plan, a meal, or anything in your medical profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4" role="log" aria-live="polite">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AiResponseMessage
            key={message.id}
            message={message}
            onRetry={onRetry}
            onFollowUpSubmit={onFollowUpSubmit}
            isFollowUpDisabled={isStreaming}
          />
        )
      )}

      {isStreaming ? (
        streamingText ? (
          <AiResponseMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingText,
              status: "streaming",
              createdAt: new Date().toISOString()
            }}
          />
        ) : (
          <TypingIndicator />
        )
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
