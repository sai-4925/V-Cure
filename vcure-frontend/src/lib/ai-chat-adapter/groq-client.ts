export interface MedicalProfileContext {
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
}

export interface GroqChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GroqStreamResult {
  success: boolean;
  text: string;
  error?: string;
}

const getDirectApiKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    (typeof window !== "undefined" ? window.localStorage.getItem("vcure_groq_key") : null) ||
    ""
  );
};
/**
 * Streams AI responses from the server-side /api/groq-chat route,
 * with automatic fallback to direct Groq API if running on static/mobile WebView.
 */
export async function streamGroqResponse(
  messages: GroqChatMessage[],
  medicalProfile: MedicalProfileContext,
  onChunk: (accumulated: string) => void
): Promise<GroqStreamResult> {
  // 1. First try server-side route
  try {
    const response = await fetch("/api/groq-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        medicalProfile
      })
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        onChunk(accumulated);
      }

      accumulated += decoder.decode();
      if (accumulated) {
        onChunk(accumulated);
      }

      return {
        success: true,
        text: accumulated.trim()
      };
    }
  } catch (err) {
    console.info("[Groq Client] /api/groq-chat route unavailable, trying direct Groq fallback...", err);
  }

  // 2. Direct Groq API fallback (for mobile APK webview or static environments)
  try {
    const conditions = (medicalProfile.conditions || []).join(", ") || "None documented";
    const medications = (medicalProfile.medications || []).join(", ") || "None documented";
    const allergies = (medicalProfile.allergies || []).join(", ") || "None documented";

    const systemPrompt = `You are V-Cure AI Assistant & Clinical Health Coach, an intelligent, empathetic, evidence-based AI assistant.

Patient Medical Profile:
- Known Conditions: ${conditions}
- Current Medications: ${medications}
- Active Allergies: ${allergies}

CORE CAPABILITIES & BEHAVIOR:
1. Health & Nutrition (In-Context): When the user asks about health, wellness, symptoms, diet, nutrition, workouts, vitals, or labs, provide accurate, evidence-based, warm guidance tailored to their profile.
2. Out-of-Context & General Knowledge Queries: You are a full-fledged intelligent AI assistant. When the user asks general questions OUTSIDE healthcare or medical context (e.g. general knowledge, science, programming, technology, history, everyday questions, creative writing, or casual conversation), answer comprehensively, helpfully, and articulately without refusing or forcing a pivot to health.
3. Strict Allergen Avoidance: The patient has registered allergies to: [${allergies}]. Whenever discussing foods, meals, snacks, or recipes, NEVER recommend or include any ingredients containing these allergens or their derivatives. If the user asks about an allergen-containing food, warn them with a clear clinical caution and suggest safe alternatives.
4. Emergency Red Flags: If symptoms suggest acute, life-threatening emergency conditions (severe sudden chest pain, shortness of breath, sudden numbness, severe head injury), advise immediate emergency medical care.
5. Formatting: Format your answers cleanly with paragraphs, bullet points, and bold text for maximum readability.`;

    const apiKey = getDirectApiKey();
    if (!apiKey) {
      return { success: false, text: "", error: "No Groq API key configured." };
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.6,
        max_tokens: 1024,
        stream: true
      })
    });

    if (!groqResponse.ok || !groqResponse.body) {
      const errText = await groqResponse.text().catch(() => "");
      console.warn("[Groq Direct] Failed:", groqResponse.status, errText);
      return { success: false, text: "", error: `Groq error: ${groqResponse.statusText}` };
    }

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (trimmed === "data: [DONE]") break;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              onChunk(accumulated);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      success: true,
      text: accumulated.trim()
    };
  } catch (directErr: any) {
    console.error("[Groq Client] Direct API call failed:", directErr);
    return {
      success: false,
      text: "",
      error: directErr?.message || "Groq connection failed"
    };
  }
}
