import {
  MOCK_CONVERSATIONS,
  MOCK_MEDICAL_CONTEXT,
  MOCK_NUTRITION_CONTEXT,
  MOCK_QUICK_PROMPTS,
  MOCK_SUGGESTED_QUESTIONS,
  buildMockResponse
} from "@/lib/ai-chat-adapter/mock-data";
import { sanitizeDietOrder } from "@/lib/ai-chat-adapter/allergen-safety";
import type {
  AttachedReport,
  ChatMessage,
  Conversation,
  ConversationDetail,
  FollowUpQuestionItem,
  SourceReference,
  TemperatureReading
} from "@/types/ai-chat";
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
  temperature: {
    id: "temperature",
    label: "Body Temperature",
    description: "Current measured body temperature (e.g. 101.4°F or 38.5°C)",
    unit: "°F",
    placeholder: "e.g. 101.2",
    options: [
      "Normal (< 99°F)",
      "Low Grade (99°F – 100.4°F)",
      "Moderate (100.5°F – 102°F)",
      "High Fever (> 102°F)"
    ]
  },
  feverDuration: {
    id: "feverDuration",
    label: "Fever Duration",
    description: "How many hours or days have you had the fever?",
    options: ["< 24 hours", "1–2 days", "3–5 days", "> 5 days"],
    placeholder: "e.g. 2 days"
  },
  feverSymptoms: {
    id: "feverSymptoms",
    label: "Associated Symptoms",
    description: "Chills, body ache, headache, cough, shivering, or fatigue",
    options: [
      "Chills / Shivering",
      "Body Ache & Headache",
      "Sore Throat & Cough",
      "Nausea / Loss of Appetite",
      "Only High Temperature"
    ],
    placeholder: "e.g. Chills and body ache"
  },
  reportUpload: {
    id: "reportUpload",
    label: "Medical / Lab Report (Optional)",
    description: "Attach CBC, blood test, Widal, Dengue test, or doctor's prescription (PDF, JPG, PNG)",
    inputType: "file",
    accept: ".pdf,image/*",
    placeholder: "Attach lab report file..."
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
    description: "Chest tightness, breathlessness, stiff neck, fainting, or severe dizziness",
    options: ["None", "Shortness of breath", "Stiff neck / Confusion", "Severe dizziness"],
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
  phase: "diet" | "diabetes" | "symptom" | "fever";
  requiredIds: string[];
  answers: Record<string, string>;
  waitingForPlan?: boolean;
  uploadedReport?: AttachedReport;
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

  async sendMessage(conversationId, content, onChunk, followUpAnswers, attachedReport) {
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
      createdAt: new Date().toISOString(),
      attachedReport: attachedReport || followUpAnswers?.find((a) => a.file)?.file
    };

    const tempAnswer = followUpAnswers?.find((a) => a.question === "temperature")?.value;
    if (tempAnswer) {
      userMessage.temperatureReading = {
        value: tempAnswer,
        unit: "°F"
      };
    }

    conversation.messages.push(userMessage);
    conversation.lastMessagePreview = userDisplayContent.slice(0, 80);
    conversation.updatedAt = userMessage.createdAt;
    if (conversation.title === "New conversation") {
      conversation.title = userDisplayContent.slice(0, 48);
    }

    // 2. Process Follow-Up Answers if provided
    if (followUpAnswers && followUpAnswers.length > 0) {
      const convState = phaseState[conversationId] || { phase: "diet", requiredIds: [], answers: {} };
      followUpAnswers.forEach(({ question, value, file }) => {
        convState.answers = { ...convState.answers, [question]: value };
        if (file) {
          convState.uploadedReport = file;
        }
      });
      if (attachedReport) {
        convState.uploadedReport = attachedReport;
      }
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

      // If in fever phase and required questions answered:
      if (state.phase === "fever") {
        const tempRaw = answers.temperature || "";
        const isHighFever = /high|> ?102|10[2-6]|39\.[0-9]|4[0-9]/i.test(tempRaw);
        const isModerateFever = /mod|100\.[5-9]|101|102/i.test(tempRaw);
        const isEmergency = /yes|severe|chest.?pain|breath|stiff|faint|unconscious|blood|convuls/i.test(answers.redFlag || "");

        const activeReport =
          attachedReport ||
          followUpAnswers.find((a) => a.file)?.file ||
          state.uploadedReport ||
          (answers.reportUpload ? { name: answers.reportUpload, size: 524288, type: "application/pdf" } : undefined);

        let feverClassification = "Low-Grade Fever";
        if (isHighFever) feverClassification = "High-Grade Fever (> 102°F)";
        else if (isModerateFever) feverClassification = "Moderate Fever (100.5°F – 102°F)";

        const emergencyAlert = isEmergency
          ? `⚠️ URGENT CLINICAL WARNING: Based on the reported emergency signs (${answers.redFlag}), please seek immediate emergency medical care or contact emergency medical services. High-grade fever accompanied by severe warning signs requires urgent clinical evaluation.`
          : `Clinical Assessment for ${feverClassification}: For fever recorded at ${tempRaw || "elevated levels"} lasting ${answers.feverDuration || "1-2 days"} with ${answers.feverSymptoms || "body ache/fatigue"}:
• Temperature Monitoring: Keep checking temperature every 3–4 hours. Use forehead sponging with room-temperature water if uncomfortable. Antipyretics (such as Paracetamol) should be taken only as prescribed by your treating doctor.
• Vital Hydration: Fever sharply accelerates bodily fluid and electrolyte depletion. Drink 2.5–3.0 liters of fluids today, prioritizing oral rehydration solutions (ORS), tender coconut water, and diluted broths.
• Rest & Gentle Diet: Nourish your body with easily digestible warm meals such as Moong Dal Khichdi, clear vegetable broth, or rice kanji. Avoid oily, spicy, fried foods, and heavy dairy products.`;

        const reportNote = activeReport
          ? `\n\n📄 Medical Report Received & Verified: "${activeReport.name}". In acute fevers, doctors review complete blood counts (CBC), platelet levels, and ESR/CRP to differentiate viral syndromes from bacterial infections. Keep this report handy for your upcoming medical consultation.`
          : `\n\n💡 Tip: If you have a recent blood test (e.g. CBC, Widal, or Dengue report), you can upload it anytime in the chat for contextual guidance.`;

        const fullResponse = `${emergencyAlert}${reportNote}`;

        const userAllergies = profile.allergies || [];
        const feverBasket = sanitizeDietOrder({
          id: `diet-order-fever-${Date.now()}`,
          title: "Fever Recovery & Hydration Kit",
          description: "Electrolyte-replenishing fluids, light digestible pulses, and immune-supportive herbal tea",
          items: [
            { id: "item-ors", name: "WHO Standard Formula ORS (Pack of 5)", quantity: "5 sachets", estimatedPriceInr: 95, category: "Pharmacy" },
            { id: "item-coconut", name: "Fresh Tender Coconut Water", quantity: "2 units", estimatedPriceInr: 110, category: "Produce" },
            { id: "item-moong", name: "Organic Yellow Moong Dal (Easy Digest)", quantity: "500g", estimatedPriceInr: 85, category: "Grains" },
            { id: "item-tulsi-tea", name: "Ayurvedic Tulsi & Ginger Infusion", quantity: "100g", estimatedPriceInr: 135, category: "Pantry" }
          ],
          totalPriceInr: 425
        }, userAllergies);

        const sources: SourceReference[] = [
          { id: "src-fever-protocol", title: "ICMR Clinical Fever & Hydration Guidelines", type: "medical_profile" }
        ];
        if (activeReport) {
          sources.push({
            id: "src-attached-report",
            title: `Uploaded Lab Report: ${activeReport.name}`,
            type: "medical_profile"
          });
        }

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: fullResponse,
          status: "sent",
          createdAt: new Date().toISOString(),
          safetyWarning: isEmergency || isHighFever
            ? {
                level: isEmergency ? "blocked" : "caution",
                message: isEmergency
                  ? "Emergency red flag symptom detected — seek immediate medical evaluation."
                  : "High fever (> 102°F) recorded — monitor vitals closely and consult your physician."
              }
            : {
                level: "info",
                message: "Educational fever and hydration guidance — not a substitute for clinical diagnosis."
              },
          sources,
          dietOrder: feverBasket,
          attachedReport: activeReport,
          temperatureReading: {
            value: tempRaw,
            unit: "°F",
            classification: isHighFever ? "High" : isModerateFever ? "Moderate" : "Low Grade"
          }
        };

        conversation.messages.push(assistantMessage);
        conversation.updatedAt = assistantMessage.createdAt;
        delete phaseState[conversationId];
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

    // Fever Inquiries (Temperature + Optional Report Upload)
    const mentionsFever =
      /fever|temperature|temp\b|pyrexia|chills|shivering|feverish|10[0-5](\.[0-9])?°?[fc]?/i.test(userMessageLower) ||
      Boolean(attachedReport);

    if (mentionsFever) {
      phaseState[conversationId] = {
        phase: "fever",
        requiredIds: ["temperature", "feverDuration", "redFlag"],
        answers: {},
        uploadedReport: attachedReport
      };

      const hasReport = Boolean(attachedReport);
      const reportNotice = hasReport
        ? ` I have also noted your attached report ("${attachedReport?.name}").`
        : " You can also optionally attach any recent lab report or doctor's prescription (CBC, Widal, Dengue test).";

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: `I understand you are experiencing a fever. To give you personalized temperature guidance, clinical monitoring steps, and appropriate recovery meal recommendations, please share your body temperature reading, duration, and any emergency signs.${reportNotice}`,
        status: "sent",
        createdAt: new Date().toISOString(),
        sources: [{ id: "src-fever-protocol", title: "Clinical Fever Assessment Protocol", type: "medical_profile" }],
        attachedReport: attachedReport,
        followUp: {
          questions: [
            QUESTION_CATALOG.temperature!,
            QUESTION_CATALOG.feverDuration!,
            QUESTION_CATALOG.feverSymptoms!,
            QUESTION_CATALOG.redFlag!,
            QUESTION_CATALOG.reportUpload!
          ],
          required: ["temperature", "feverDuration", "redFlag"]
        }
      };
      conversation.messages.push(assistantMessage);
      conversation.updatedAt = assistantMessage.createdAt;
      return assistantMessage;
    }

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

    // Generic Symptom Inquiries (excluding fever)
    const mentionsSymptom = /symptom|pain|cough|headache|dizzy|nausea|fatigue|ache|vomit|sick/i.test(userMessageLower);
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