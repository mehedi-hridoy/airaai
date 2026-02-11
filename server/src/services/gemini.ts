import { GoogleGenerativeAI, Content } from "@google/generative-ai";

// Lazy initialization to ensure env vars are loaded first
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    console.log("🔑 Initializing Gemini with API key:", apiKey.substring(0, 10) + "...");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
}

const SYSTEM_INSTRUCTION = `You are Aira, an intelligent AI voice assistant powered by Aira AI - the world's first infrastructure-level voice AI platform.

Your capabilities:
1. You have comprehensive knowledge about specific companies through a RAG system
2. You speak naturally and conversationally, like a helpful team member
3. You're knowledgeable, professional, and friendly
4. You provide accurate information based on the context provided

Guidelines:
- When company context is provided, use it to answer accurately
- If you don't have specific information, say so honestly
- Keep responses conversational and concise (suitable for voice)
- Be helpful and proactive in offering relevant information
- Never make up facts about companies - only use provided context`;

export async function generateChatResponse(
  message: string,
  context: string,
  history: ChatMessage[] = []
): Promise<string> {
  // Reset genAI to pick up new API key if changed
  genAI = null;
  
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // Build conversation history for multi-turn chat
  const chatHistory: Content[] = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
  });

  // Construct the prompt with RAG context
  const prompt = context
    ? `Context from knowledge base:\n${context}\n\nUser question: ${message}`
    : message;

  try {
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text();
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    
    // Check for rate limit error
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number };
      if (apiError.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
    }
    throw new Error("Failed to generate response. Please try again.");
  }
}

export async function generateStreamingResponse(
  message: string,
  context: string,
  history: ChatMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const chatHistory: Content[] = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
  });

  const prompt = context
    ? `Context from knowledge base:\n${context}\n\nUser question: ${message}`
    : message;

  try {
    const result = await chat.sendMessageStream(prompt);
    let fullResponse = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }

    return fullResponse;
  } catch (error) {
    console.error("Gemini streaming error:", error);
    throw new Error("Failed to generate streaming response");
  }
}
