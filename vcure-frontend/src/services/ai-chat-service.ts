import { aiChatAdapter } from "@/lib/ai-chat-adapter";
import type { FollowUpAnswer } from "@/lib/ai-chat-adapter/types";
import type { AttachedReport } from "@/types/ai-chat";

export const aiChatService = {
  getConversations: () => aiChatAdapter.getConversations(),
  getConversation: (conversationId: string) => aiChatAdapter.getConversation(conversationId),
  createConversation: () => aiChatAdapter.createConversation(),
  renameConversation: (conversationId: string, title: string) =>
    aiChatAdapter.renameConversation(conversationId, title),
  deleteConversation: (conversationId: string) => aiChatAdapter.deleteConversation(conversationId),
  sendMessage: (
    conversationId: string,
    content: string,
    onChunk: (text: string) => void,
    followUpAnswers?: FollowUpAnswer[],
    attachedReport?: AttachedReport
  ) => aiChatAdapter.sendMessage(conversationId, content, onChunk, followUpAnswers, attachedReport),
  getSuggestedQuestions: () => aiChatAdapter.getSuggestedQuestions(),
  getQuickPrompts: () => aiChatAdapter.getQuickPrompts(),
  getMedicalContext: () => aiChatAdapter.getMedicalContext(),
  getNutritionContext: () => aiChatAdapter.getNutritionContext()
};
