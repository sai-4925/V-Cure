import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "@/services/ai-chat-service";
import { useAiChatStore } from "@/store/ai-chat-store";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";

export function useConversations() {
  return useQuery({ queryKey: ["ai-chat", "conversations"], queryFn: aiChatService.getConversations });
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-chat", "conversation", conversationId],
    queryFn: () => aiChatService.getConversation(conversationId as string),
    enabled: Boolean(conversationId)
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const setActiveConversationId = useAiChatStore((state) => state.setActiveConversationId);
  return useMutation({
    mutationFn: () => aiChatService.createConversation(),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["ai-chat", "conversations"] });
      setActiveConversationId(conversation.id);
    }
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      aiChatService.renameConversation(conversationId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-chat", "conversations"] })
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const activeConversationId = useAiChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useAiChatStore((state) => state.setActiveConversationId);
  return useMutation({
    mutationFn: (conversationId: string) => aiChatService.deleteConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["ai-chat", "conversations"] });
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    }
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  const setStreamingText = useAiChatStore((state) => state.setStreamingText);
  const setIsStreaming = useAiChatStore((state) => state.setIsStreaming);

  return useMutation({
    mutationFn: async ({ content, followUpAnswers }: { content: string; followUpAnswers?: FollowUpAnswer[] }) => {
      if (!conversationId) throw new Error("No active conversation");
      setIsStreaming(true);
      setStreamingText("");
      try {
        return await aiChatService.sendMessage(conversationId, content, (partial) => {
          setStreamingText(partial);
        }, followUpAnswers);
      } finally {
        setIsStreaming(false);
        setStreamingText(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-chat", "conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["ai-chat", "conversations"] });
    }
  });
}

export function useSuggestedQuestions() {
  return useQuery({ queryKey: ["ai-chat", "suggested"], queryFn: aiChatService.getSuggestedQuestions });
}

export function useQuickPrompts() {
  return useQuery({ queryKey: ["ai-chat", "quick-prompts"], queryFn: aiChatService.getQuickPrompts });
}

export function useMedicalContext() {
  return useQuery({ queryKey: ["ai-chat", "medical-context"], queryFn: aiChatService.getMedicalContext });
}

export function useNutritionContext() {
  return useQuery({ queryKey: ["ai-chat", "nutrition-context"], queryFn: aiChatService.getNutritionContext });
}
