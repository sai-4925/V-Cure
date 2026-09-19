import {
  MOCK_CONVERSATIONS,
  MOCK_MEDICAL_CONTEXT,
  MOCK_NUTRITION_CONTEXT,
  MOCK_QUICK_PROMPTS,
  MOCK_SUGGESTED_QUESTIONS,
  buildMockResponse
} from "@/lib/ai-chat-adapter/mock-data";
import { sanitizeDietOrder } from "@/lib/ai-chat-adapter/allergen-safety";
import type { ChatMessage, Conversation, ConversationDetail, FollowUpQuestionItem } from "@/types/ai-chat";
import type { AiChatAdapter, FollowUpAnswer } from "@/lib/ai-chat-adapter/types";

export const QUESTION_CATALOG: Record<string, FollowUpQuestionItem> = {
  feeling: {
    id: "feeling",
    label: "Current Feeling & Well-being",
    description: "How are you feeling overall today?",
    options: ["Good / Stable", "Fatigued / Sluggish", "Dizzy / Shaky", "Unwell"],
    placeholder: "e.g. Feeling energetic"
  },
  energy: {
    id: "energy",
    label: "Energy Level",
    description: "Your stamina during typical daily activities",
    options: ["High", "Moderate", "Low", "Exhausted"],
    placeholder: "e.g. Moderate"
  },
  hba1c: {
    id: "hba1c",
    label: "HbA1c Blood Level",
    description: "Your 3-month average blood glucose percentage",
    unit: "%",
    placeholder: "e.g. 6.5"
  },
  fastingGlucose: {
    id: "fastingGlucose",
    label: "Fasting Blood Glucose",
    description: "Pre-breakfast blood glucose level",
    unit: "mg/dL",
    placeholder: "e.g. 105"
  },
  duration: {
    id: "duration",
    label: "Symptom Duration",
    description: "How long have you experienced these symptoms?",
    options: ["< 24 hours", "1–3 days", "4–7 days", "> 1 week"],
    placeholder: "e.g. 2 days"
  },
  severity: {
    id: "severity",
    label: "Severity Level",
    description: "Intensity of discomfort during daily tasks",
    options: ["Mild", "Moderate", "Severe"],
    placeholder: "e.g. Mild"
  },
  redFlag: {
    id: "redFlag",
    label: "Emergency Red Flags",
    description: "Chest tightness, breathlessness, fainting, or severe dizziness",
    options: ["None", "Shortness of breath", "Chest tightness", "Severe dizziness"],
    placeholder: "e.g. None"
  }
};

const SIMULATED_LATENCY_MS = 300;
const STREAM_CHUNK_DELAY_MS = 28;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let conversations: ConversationDetail[] = MOCK_CONVERSATIONS.map((c) => ({
  ...c,
  messages: [...c.messages]
}));

function findConversation(id: string): ConversationDetail {
  const conversation = conversations.find((c) => c.id === id);
  if (!conversation) throw new Error(`Conversation ${id} not found`);
  return conversation;
}

function toSummary(conversation: ConversationDetail): Conversation {
  const { messages: _messages, ...summary } = conversation;
  return summary;
}

// Phase tracking per conversation to enforce required-answer batch collection
type PhaseState = {
  phase: "diet" | "diabetes" | "symptom";
  requiredIds: string[];
  answers: Record<string, string>;
  waitingForPlan?: boolean;
};

const phaseState: Record<string, PhaseState> = {};

export const mockAiChatAdapter: AiChatAdapter = {
  async getConversations() {
    return delay(conversations.map(toSummary));
  },

  async getConversation(conversationId: string) {
    const conversation = findConversation(conversationId);
    const profile = await getRealMedicalContext();
    const userAllergies = profile.allergies || [];
    const sanitizedMessages = conversation.messages.map((m) => {
      if (m.dietOrder) {
        return { ...m, dietOrder: sanitizeDietOrder(m.dietOrder, userAllergies) };
      }
      return m;
    });
    return delay({ ...conversation, messages: sanitizedMessages });
  },

  async createConversation() {
    const now = new Date().toISOString();
    const conversation: ConversationDetail = {
      id: `conv-${Date.now()}`,
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      lastMessagePreview: "",
      messages: []
    };
    conversations = [conversation, ...conversations];
    return delay({ ...conversation });
  },

  async renameConversation(conversationId: string, title: string) {
    const conversation = findConversation(conversationId);
    conversation.title = title;
    return delay(toSummary(conversation));
  },

  async deleteConversation(conversationId: string) {
    conversations = conversations.filter((c) => c.id !== conversationId);
    return delay(undefined);
  },

  async sendMessage(conversationId, content, onChunk, followUpAnswers) {
    const conversation = findConversation(conversationId);
    const profile = await getRealMedicalContext();

    // 1. Record User Message
    const userDisplayContent =
      followUpAnswers && followUpAnswers.length > 0
        ? followUpAnswers.map((a) => `${a.question}: ${a.value}`).join(", ")
        : content;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: userDisplayContent,
      status: "sent",
      createdAt: new Date().toISOString()
    };
    conversation.messages.push(userMessage);
    conversation.lastMessagePreview = userDisplayContent.slice(0, 80);
    conversation.updatedAt = userMessage.createdAt;
    if (conversation.title === "New conversation") {
      conversation.title = userDisplayContent.slice(0, 48);
    }

    // 2. Process Follow-Up Answers if provided
    if (followUpAnswers && followUpAnswers.length > 0) {
      const convState = phaseState[conversationId] || { phase: "diet", requiredIds: [], answers: {} };
      followUpAnswers.forEach(({ question, value }) => {
        convState.answers = { ...convState.answers, [question]: value };
      });
      phaseState[conversationId] = convState;

      const state = phaseState[conversationId];
      const pendingRequiredIds = state.requiredIds || [];
      const answers = state.answers || {};
      const missing = pendingRequiredIds.filter((id) => !answers[id]?.trim());
      if (missing.length > 0) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: `Please provide all required details before I can finalize your guidance: ${missing.map((id) => QUESTION_CATALOG[id]?.label || id).join(", ")}.`,
          status: "sent",
          createdAt: new Date().toISOString(),
          followUp: {
            questions: pendingRequiredIds.map((id) => QUESTION_CATALOG[id] ?? id),
            required: missing
          }
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        return assistantMessage;
      }

      // If in diabetes phase and required feeling & energy answered:
      if (state.phase === "diabetes") {
        const hasOptionalLabs = answers.hba1c || answers.fastingGlucose;
        const labNotes = [
          answers.hba1c ? `HbA1c: ${answers.hba1c}%` : null,
          answers.fastingGlucose ? `Fasting Glucose: ${answers.fastingGlucose} mg/dL` : null
        ].filter(Boolean).join(", ");

        const planText = hasOptionalLabs
          ? `Based on your reported energy (${answers.energy}), feeling (${answers.feeling}), and lab markers (${labNotes}), here is your tailored diabetes wellness plan: Focus on low-glycemic complex carbohydrates (such as Moong Dal Cheela or Vegetable Oats), pair all carbs with lean protein, maintain hydration with 2.5L water daily, and monitor post-prandial levels.`
          : `Based on your reported energy (${answers.energy}) and general feeling (${answers.feeling}), here is your personalized diabetes meal and wellness plan: Maintain consistent meal timings, prioritize high-fiber vegetables, stay active with 30 minutes of brisk walking, and keep simple sugars strictly restricted.`;

        const userAllergies = profile.allergies || [];
        const allergySuffix = userAllergies.length > 0
          ? ` All recommended ingredients are verified 100% free of your registered allergies (${userAllergies.join(", ")}).`
          : "";

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: `${planText}${allergySuffix}`,
          status: "sent",
          createdAt: new Date().toISOString(),
          sources: [
            { id: "src-diabetes", title: "Diabetes Clinical Guidelines", type: "medical_profile" },
            { id: "src-plan", title: "Personalized Low-GI Meal Plan", type: "meal_plan" }
          ],
          dietOrder: sanitizeDietOrder({
            id: `diet-order-${Date.now()}`,
            title: "Diabetic Low-GI Meal Ingredients",
            description: "Fresh, blood sugar-stabilizing ingredients to prepare your recommended low-GI meals",
            items: [
              { id: "item-oats", name: "Steel Cut Rolled Oats", quantity: "500g", estimatedPriceInr: 180, category: "Grains" },
              { id: "item-moong", name: "Organic Yellow Moong Dal", quantity: "1kg", estimatedPriceInr: 160, category: "Grains" },
              { id: "item-chia", name: "Raw Organic Chia Seeds", quantity: "200g", estimatedPriceInr: 140, category: "Pantry" },
              { id: "item-spinach", name: "Fresh Baby Spinach Leaves", quantity: "250g", estimatedPriceInr: 60, category: "Produce" }
            ],
            totalPriceInr: 540
          }, userAllergies)
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        delete phaseState[conversationId];
        return assistantMessage;
      }

      // If in symptom phase and required questions answered:
      if (state.phase === "symptom") {
        const isEmergency = /yes|severe|chest.?pain|breath|faint|unconscious|blood/i.test(answers.redFlag || "");
        const guidanceText = isEmergency
          ? `⚠️ URGENT CLINICAL NOTICE: Based on the red-flag indicators reported (${answers.redFlag}), please seek immediate in-person emergency medical care or call your local emergency service. V-Cure Coach is an educational platform and cannot provide emergency treatment.`
          : `Symptom Guidance: For symptoms lasting ${answers.duration} at ${answers.severity} severity without emergency red flags, prioritize rest, maintain fluid intake, and record temperature and vitals. Please consult your physician if symptoms intensify or persist beyond 48 hours.`;

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: guidanceText,
          status: "sent",
          createdAt: new Date().toISOString(),
          safetyWarning: isEmergency
            ? { level: "blocked", message: "Emergency red-flag symptom detected — seek immediate clinical attention." }
            : { level: "info", message: "Educational symptom guidance only — not a definitive medical diagnosis." },
          sources: [{ id: "src-symptoms", title: "Clinical Symptom Protocol", type: "medical_profile" }]
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        delete phaseState[conversationId];
        return assistantMessage;
      }
    }

    // 3. User Message Prompt Classification
    const userMessageLower = content.toLowerCase();
    const hasDiabetes = (profile.conditions || []).some((c) => c.toLowerCase().includes("diabetes"));

    // Diet Phase A (preference, budget, home-cooked)
    const hasDietPref = /diet|meal|food|breakfast|lunch|dinner|snack/i.test(userMessageLower);
    const hasBudget = /budget|price|cost|₹|\$|cheap|affordable/i.test(userMessageLower);
    const hasHome = /home|cook|prep|recipe|kitchen/i.test(userMessageLower);

    if (hasDietPref && (hasBudget || hasHome)) {
      if (hasDiabetes) {
        phaseState[conversationId] = {
          phase: "diabetes",
          requiredIds: ["feeling", "energy"],
          answers: {}
        };
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: `I see diabetes is documented in your medical profile. To customize an optimal low-GI nutrition plan, please answer a few quick questions regarding your current condition and energy:`,
          status: "sent",
          createdAt: new Date().toISOString(),
          sources: [{ id: "src-diabetes", title: "Diabetes Assessment", type: "medical_profile" }],
          followUp: {
            questions: [
              QUESTION_CATALOG.feeling!,
              QUESTION_CATALOG.energy!,
              QUESTION_CATALOG.hba1c!,
              QUESTION_CATALOG.fastingGlucose!
            ],
            required: ["feeling", "energy"]
          }
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        return assistantMessage;
      } else {
        phaseState[conversationId] = {
          phase: "diet",
          requiredIds: ["feeling", "energy"],
          answers: {}
        };
        const userAllergies = profile.allergies || [];
        const allergyNote = userAllergies.length > 0
          ? ` I have strictly excluded your registered allergies (${userAllergies.join(", ")}) and verified all ingredients are 100% allergen-safe.`
          : "";

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: `Thank you for sharing your dietary preferences, budget, and cooking habits! Based on your profile, here is your personalized plan: Focus on balanced macronutrients (complex grains, legumes, and plenty of greens). Prepare meals in batches to stay within budget.${allergyNote}`,
          status: "sent",
          createdAt: new Date().toISOString(),
          sources: [{ id: "src-plan", title: "Personalized Meal Plan", type: "meal_plan" }],
          dietOrder: sanitizeDietOrder({
            id: `diet-order-${Date.now()}`,
            title: "Balanced Daily Nutrition Basket",
            description: "Essential complex grains, legumes, and pantry staples for your home meals",
            items: [
              { id: "item-quinoa", name: "Whole Grain White Quinoa", quantity: "500g", estimatedPriceInr: 220, category: "Grains" },
              { id: "item-lentils", name: "Split Red Lentils (Masoor Dal)", quantity: "1kg", estimatedPriceInr: 130, category: "Grains" },
              { id: "item-almonds", name: "California Raw Almonds", quantity: "250g", estimatedPriceInr: 260, category: "Pantry" }
            ],
            totalPriceInr: 610
          }, userAllergies)
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        return assistantMessage;
      }
    }

    // Symptom Inquiries
    const mentionsSymptom = /symptom|pain|fever|cough|headache|dizzy|nausea|fatigue|ache|vomit|sick/i.test(userMessageLower);
    if (mentionsSymptom) {
      phaseState[conversationId] = {
        phase: "symptom",
        requiredIds: ["duration", "severity", "redFlag"],
        answers: {}
      };
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: `I notice you are describing symptoms. To assist safely, please provide the duration, severity level, and indicate whether any emergency red flags (e.g. chest pressure, shortness of breath, loss of consciousness) are present:`,
        status: "sent",
        createdAt: new Date().toISOString(),
        sources: [{ id: "src-symptoms", title: "Symptom Assessment Protocol", type: "medical_profile" }],
        followUp: {
          questions: [
            QUESTION_CATALOG.duration!,
            QUESTION_CATALOG.severity!,
            QUESTION_CATALOG.redFlag!
          ],
          required: ["duration", "severity", "redFlag"]
        }
      };
      conversation.messages.push(assistantMessage);
      conversation.updatedAt = assistantMessage.createdAt;
      return assistantMessage;
    }

    // Default conversational response with streaming simulation
    const { text, safetyWarning } = buildMockResponse(content, profile);
    const words = text.split(" ");
    let accumulated = "";

    for (const word of words) {
      accumulated += (accumulated ? " " : "") + word;
      onChunk(accumulated);
      // eslint-disable-next-line no-await-in-loop
      await delay(undefined, STREAM_CHUNK_DELAY_MS);
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: text,
      status: "sent",
      createdAt: new Date().toISOString(),
      safetyWarning,
      sources:
        /quinoa|lunch|meal|breakfast|dinner|snack/i.test(content)
          ? [{ id: "src-meal", title: "Your active meal plan", type: "meal_plan" }]
          : undefined,
      dietOrder:
        /diet|food|meal|breakfast|lunch|dinner|snack|protein|recipe|nutrition/i.test(content)
          ? sanitizeDietOrder({
              id: `diet-order-${Date.now()}`,
              title: "Recommended Diet & Meal Ingredients",
              description: "Fresh, nutrient-dense ingredients recommended for your daily diet",
              items: [
                { id: "item-quinoa", name: "Organic White Quinoa", quantity: "500g", estimatedPriceInr: 220, category: "Grains" },
                { id: "item-yogurt", name: "High-Protein Greek Yogurt", quantity: "400g", estimatedPriceInr: 120, category: "Dairy" },
                { id: "item-seeds", name: "Raw Chia & Flax Seed Mix", quantity: "200g", estimatedPriceInr: 150, category: "Pantry" },
                { id: "item-berries", name: "Fresh Blueberries Pack", quantity: "125g", estimatedPriceInr: 180, category: "Produce" }
              ],
              totalPriceInr: 670
            }, profile.allergies || [])
          : undefined
    };
    conversation.messages.push(assistantMessage);
    conversation.lastMessagePreview = text.slice(0, 80);
    conversation.updatedAt = assistantMessage.createdAt;

    return assistantMessage;
  },

  async getSuggestedQuestions() {
    return delay(MOCK_SUGGESTED_QUESTIONS);
  },

  async getQuickPrompts() {
    return delay(MOCK_QUICK_PROMPTS);
  },

  async getMedicalContext() {
    return delay(await getRealMedicalContext());
  },

  async getNutritionContext() {
    return delay(await getRealNutritionContext());
  }
};

async function getRealMedicalContext(): Promise<typeof MOCK_MEDICAL_CONTEXT> {
  try {
    // Import the service dynamically to avoid potential circular dependency issues
    const { fetchMedicalProfile } = await import("@/services/medical-history-service");
    const profile = await fetchMedicalProfile();
    // Include mock-like structure for compatibility
    return {
      conditions: profile.conditions || [],
      allergies: profile.allergies || [],
      medications: profile.medications || []
    };
  } catch (error) {
    console.warn("[ai-chat] profile fetch failed, using mock medical context", error);
    return MOCK_MEDICAL_CONTEXT;
  }
}

async function getRealNutritionContext(): Promise<typeof MOCK_NUTRITION_CONTEXT> {
  // For now, return mock; in real app this would fetch from nutrition profile API
  console.warn("[ai-chat] nutrition profile fetch not implemented, using mock nutrition context");
  return MOCK_NUTRITION_CONTEXT;
}