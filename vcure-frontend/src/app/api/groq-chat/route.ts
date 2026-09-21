import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface MedicalProfileInput {
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
}

interface ChatMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages = [], medicalProfile = {} }: { messages: ChatMessageInput[]; medicalProfile?: MedicalProfileInput } = body;

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

    const fullMessages: ChatMessageInput[] = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const modelName = process.env.GROQ_DEFAULT_MODEL || "openai/gpt-oss-120b";

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: fullMessages,
        temperature: 0.6,
        max_tokens: 1024,
        stream: true
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("[Groq API Error]", groqResponse.status, errorText);

      // Attempt fallback to 20b model if primary was rejected or busy
      if (modelName !== "openai/gpt-oss-20b") {
        console.info("[Groq] Attempting fallback to openai/gpt-oss-20b");
        const fallbackResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: fullMessages,
            temperature: 0.6,
            max_tokens: 1024,
            stream: true
          })
        });

        if (fallbackResponse.ok && fallbackResponse.body) {
          return createStreamResponse(fallbackResponse.body);
        }
      }

      return NextResponse.json(
        { error: `Groq upstream error: ${groqResponse.statusText}` },
        { status: groqResponse.status }
      );
    }

    if (!groqResponse.body) {
      return NextResponse.json({ error: "No response body from Groq" }, { status: 502 });
    }

    return createStreamResponse(groqResponse.body);
  } catch (error: any) {
    console.error("[groq-chat route error]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Transforms upstream OpenAI/Groq SSE chunks (data: {...}) into raw text stream chunks
 */
function createStreamResponse(upstreamBody: ReadableStream<Uint8Array>): Response {
  const reader = upstreamBody.getReader();
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;

            if (trimmed === "data: [DONE]") {
              controller.close();
              return;
            }

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  controller.enqueue(encoder.encode(deltaContent));
                }
              } catch {
                // Ignore partial or unparseable SSE lines
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
