const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const isProduction = process.env.NODE_ENV === "production";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
}

const SYSTEM_INSTRUCTION = `You are Aira, a female-voiced AI assistant.

Persona:
- Sound warm, bright, cute, and confident (never childish).
- Be agentic, emotionally friendly, and easy to talk to.
- Keep answers concise and natural for voice conversation.
- Start with a direct answer first, then add 1 brief helpful follow-up line.

Knowledge behavior:
- If RAG context is provided, prioritize it over assumptions.
- If web context is provided, use it carefully and mention uncertainty when facts may be time-sensitive.
- Never fabricate facts.
- If unknown, say so gracefully and offer next best help.
- Answer exactly what is asked first, then optionally offer deeper detail.
- Keep most answers short (2-5 sentences) unless user asks for a detailed explanation.
- If user asks for a founder name but context only contains leadership roles (like CEO), provide the CEO name and clearly state that the provided data lists CEO/leadership and does not explicitly confirm founder title.
- If user asks about Gigalogy and go-to-market relevance, explain that Gigalogy is being positioned as Aira’s first pilot program and early go-to-market partner.
- Handle general questions across topics clearly; if outside available context, answer carefully and mark uncertainty.

Safety:
- Refuse inappropriate, sexual, hateful, violent, illegal, or abusive requests.
- Stay professional and respectful.

Style:
- Use clear English.
- Avoid hype and exaggerated claims.
- Keep responses compact unless user asks for depth.`;

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  if (!isProduction) {
    console.log("🔑 Using Groq API key:", `${apiKey.slice(0, 8)}...`);
  }
  return apiKey;
}

function toGroqMessages(message: string, context: string, history: ChatMessage[]) {
  const prompt = context
    ? `Knowledge context:\n${context}\n\nUser question: ${message}`
    : message;

  return [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: prompt },
  ];
}

export async function generateChatResponse(
  message: string,
  context: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.4,
        max_completion_tokens: 220,
        top_p: 0.9,
        stream: false,
        reasoning_effort: "low",
        messages: toGroqMessages(message, context, history),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq chat error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Empty response from Groq model");
    }

    return text;
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    throw new Error("Failed to generate response. Please try again.");
  }
}

export async function generateStreamingResponse(
  message: string,
  context: string,
  history: ChatMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.4,
        max_completion_tokens: 220,
        top_p: 0.9,
        stream: true,
        reasoning_effort: "low",
        messages: toGroqMessages(message, context, history),
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`Groq streaming error ${response.status}: ${errorText}`);
    }

    const decoder = new TextDecoder("utf-8");
    const reader = response.body.getReader();
    let fullResponse = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullResponse += delta;
            onChunk(delta);
          }
        } catch {
          // Ignore partial JSON lines.
        }
      }
    }

    if (!fullResponse.trim()) {
      throw new Error("Empty streaming response from Groq model");
    }

    return fullResponse;
  } catch (error) {
    console.error("Groq streaming error:", error);
    throw new Error("Failed to generate streaming response");
  }
}
