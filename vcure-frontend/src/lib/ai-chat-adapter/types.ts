import type {
  AttachedReport,
  ChatMessage,
  Conversation,
  ConversationDetail,
  MedicalContextSnapshot,
  NutritionContextSnapshot,
  QuickPrompt,
  SuggestedQuestion
} from "@/types/ai-chat";

export interface FollowUpAnswer {
  question: string;
  value: string;
  file?: AttachedReport;
}

export interface AiChatAdapter {
  getConversations(): Promise<Conversation[]>;
  getConversation(conversationId: string): Promise<ConversationDetail>;
  createConversation(): Promise<ConversationDetail>;
  renameConversation(conversationId: string, title: string): Promise<Conversation>;
  deleteConversation(conversationId: string): Promise<void>;
  // Streams the assistant's response via onChunk (cumulative text) and
  // resolves with the final persisted ChatMessage once complete. The
  // frontend never composes response content — it only renders what the
  // adapter (backed by a real AI service, eventually) sends back.
  // `followUpAnswers` carries a batch of answers collected via the
  // follow-up chips; when present the adapter resolves the pending phase.
  sendMessage(
    conversationId: string,
    content: string,
    onChunk: (partialText: string) => void,
    followUpAnswers?: FollowUpAnswer[],
    attachedReport?: AttachedReport
  ): Promise<ChatMessage>;
  getSuggestedQuestions(): Promise<SuggestedQuestion[]>;
  getQuickPrompts(): Promise<QuickPrompt[]>;
  getMedicalContext(): Promise<MedicalContextSnapshot>;
  getNutritionContext(): Promise<NutritionContextSnapshot>;
}
