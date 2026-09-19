import type {
  ConversationDetail,
  MedicalContextSnapshot,
  NutritionContextSnapshot,
  QuickPrompt,
  SuggestedQuestion
} from "@/types/ai-chat";

export const MOCK_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: "sq1", label: "Why was this meal recommended?", prompt: "Why was today's lunch recommended for me?" },
  { id: "sq2", label: "Am I hitting my protein target?", prompt: "Am I hitting my daily protein target this week?" },
  { id: "sq3", label: "Explain my BMI trend", prompt: "Can you explain what my BMI trend means?" }
];

export const MOCK_QUICK_PROMPTS: QuickPrompt[] = [
  { id: "qp1", category: "Nutrition", label: "Suggest a snack", prompt: "Suggest a healthy snack for right now." },
  { id: "qp2", category: "Nutrition", label: "Check an ingredient", prompt: "Is honey safe for me given my profile?" },
  { id: "qp3", category: "Health", label: "Explain a lab term", prompt: "What does HbA1c mean?" },
  { id: "qp4", category: "Health", label: "Sleep tips", prompt: "How can I improve my sleep consistency?" }
];

export const MOCK_MEDICAL_CONTEXT: MedicalContextSnapshot = {
  conditions: ["Type 2 Diabetes (Managed)"],
  allergies: ["Peanuts"],
  medications: ["Metformin"]
};

export const MOCK_NUTRITION_CONTEXT: NutritionContextSnapshot = {
  today: {
    calories: 1240,
    macros: { proteinG: 58, carbsG: 140, fatG: 42 },
    micronutrients: [{ name: "Iron", amount: "6mg", percentOfDailyValue: 33 }]
  },
  calorieTargetToday: 2000
};

export const MOCK_CONVERSATIONS: ConversationDetail[] = [
  {
    id: "conv-1",
    title: "Lunch recommendation",
    createdAt: "2026-08-05T09:00:00Z",
    updatedAt: "2026-08-05T09:04:00Z",
    lastMessagePreview: "It's a good fit because it's high in fiber...",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Why was the quinoa bowl recommended for lunch today?",
        status: "sent",
        createdAt: "2026-08-05T09:00:00Z"
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "It's a good fit because it's high in fiber and plant-based protein, which lines up with your current goal and doesn't conflict with anything in your medical profile. It also stays within your calorie target for lunch.",
        status: "sent",
        createdAt: "2026-08-05T09:00:20Z",
        sources: [{ id: "src1", title: "Vegetable Quinoa Power Bowl", type: "meal_plan" }],
        dietOrder: {
          id: "diet-order-quinoa",
          title: "Quinoa Power Bowl Ingredients",
          description: "Fresh ingredients to prepare your recommended high-fiber lunch",
          items: [
            { id: "item-quinoa", name: "Organic White Quinoa", quantity: "500g", estimatedPriceInr: 220, category: "Grains" },
            { id: "item-spinach", name: "Fresh Baby Spinach Leaves", quantity: "250g", estimatedPriceInr: 60, category: "Produce" },
            { id: "item-olive-oil", name: "Extra Virgin Olive Oil", quantity: "250ml", estimatedPriceInr: 210, category: "Pantry" },
            { id: "item-chickpeas", name: "Steamed Organic Chickpeas", quantity: "400g", estimatedPriceInr: 140, category: "Produce" }
          ],
          totalPriceInr: 630
        }
      }
    ]
  },
  {
    id: "conv-2",
    title: "Diabetic low-GI breakfast",
    createdAt: "2026-08-06T08:15:00Z",
    updatedAt: "2026-08-06T08:18:00Z",
    lastMessagePreview: "Here is a blood-sugar stabilizing low-GI breakfast...",
    messages: [
      {
        id: "m3",
        role: "user",
        content: "Can you recommend a healthy low-GI breakfast for managing my blood sugar?",
        status: "sent",
        createdAt: "2026-08-06T08:15:00Z"
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Here is your personalized blood-sugar stabilizing low-GI breakfast: Steel-cut rolled oats with chia seeds, paired with fresh berries and unsweetened almond milk. These complex carbohydrates prevent glucose spikes and provide sustained morning stamina.",
        status: "sent",
        createdAt: "2026-08-06T08:15:30Z",
        sources: [{ id: "src2", title: "Low-GI Breakfast Protocol", type: "medical_profile" }],
        dietOrder: {
          id: "diet-order-diabetes",
          title: "Diabetic Low-GI Breakfast Basket",
          description: "Fresh, glycemic-controlled ingredients to prepare your morning meal",
          items: [
            { id: "item-oats", name: "Steel Cut Rolled Oats", quantity: "500g", estimatedPriceInr: 180, category: "Grains" },
            { id: "item-chia", name: "Raw Organic Chia Seeds", quantity: "200g", estimatedPriceInr: 140, category: "Pantry" },
            { id: "item-berries", name: "Fresh Blueberries Pack", quantity: "125g", estimatedPriceInr: 180, category: "Produce" },
            { id: "item-almond-milk", name: "Unsweetened Almond Milk", quantity: "1L", estimatedPriceInr: 190, category: "Dairy" }
          ],
          totalPriceInr: 690
        }
      }
    ]
  }
];

import {
  findContainedAllergens,
  normalizeAllergenKey,
  ALLERGEN_CATALOG
} from "./allergen-safety";

export function buildMockResponse(
  userMessage: string,
  medicalContext: MedicalContextSnapshot
): { text: string; safetyWarning?: { level: "caution" | "blocked"; message: string } } {
  const allergenMatches = findContainedAllergens(userMessage, medicalContext.allergies);
  const firstMatch = allergenMatches[0];

  if (firstMatch) {
    const { allergen, matchedAlias } = firstMatch;
    const key = normalizeAllergenKey(allergen);
    const def = ALLERGEN_CATALOG[key];
    const alternatives = def?.safeAlternatives?.join(", ") || "safe allergen-free options";

    return {
      text: `⚠️ Medical Profile Allergy Alert: You have a registered allergy to **${allergen}**. Consuming items containing "${matchedAlias}" could trigger an adverse reaction, so I have strictly excluded it from your recommendations. Instead, I recommend safe alternatives such as ${alternatives}. Would you like an itemized allergen-safe meal basket?`,
      safetyWarning: {
        level: "caution",
        message: `Allergy Alert: "${matchedAlias}" conflicts with your registered ${allergen} allergy.`
      }
    };
  }

  if (/hba1c|blood sugar|glucose/i.test(userMessage)) {
    return {
      text: "HbA1c reflects your average blood sugar over roughly the past 2-3 months, unlike a fasting glucose reading which only captures a single moment. It's one of the main markers used to monitor diabetes management over time — worth discussing trends with your doctor rather than a single reading in isolation."
    };
  }

  const isDairyAllergic = (medicalContext.allergies || []).some((a) =>
    /dairy|milk|lactose/i.test(a)
  );

  if (/protein/i.test(userMessage)) {
    const proteinSnack = isDairyAllergic
      ? "roasted chickpeas or a chia seed pudding"
      : "Greek yogurt or roasted chickpeas";
    return {
      text: `Based on your recent logs, you're averaging close to your protein target most days this week. Adding an allergen-safe, protein-forward snack like ${proteinSnack} will help close the gap without conflicting with your medical profile.`
    };
  }

  const safeAllergyNotice =
    medicalContext.allergies && medicalContext.allergies.length > 0
      ? ` My recommendations are strictly filtered to exclude your registered allergies (${medicalContext.allergies.join(", ")}).`
      : "";

  return {
    text: `Here's what I can tell you based on your profile and recent activity: your plan currently prioritizes steady blood sugar and adequate protein, and nothing in today's log conflicts with your medical profile.${safeAllergyNotice} Let me know if you want me to customize a safe meal basket for you.`
  };
}

