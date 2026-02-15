import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse, generateStreamingResponse, ChatMessage } from "../services/gemini.js";
import { searchContext } from "../services/rag.js";
import { getSafetyRefusalMessage, isInappropriateQuery } from "../services/safety.js";
import { getWebSearchContext } from "../services/web-search.js";

export const chatRouter = Router();

// In-memory conversation store (for MVP - use Redis/DB for production)
const conversations = new Map<string, ChatMessage[]>();

interface ChatRequest {
  message: string;
  conversationId?: string;
  companyId?: string;
  stream?: boolean;
}

function normalizeAssistantText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGigalogyFounderQuestion(message: string): boolean {
  const q = message.toLowerCase();
  const asksFounder = /\bfounder\b|\bco[ -]?founder\b/.test(q);
  const mentionsGigalogy = /\bgiga\w*\b/.test(q);
  return asksFounder && mentionsGigalogy;
}

/**
 * POST /api/chat
 * Main chat endpoint for voice/text interactions
 */
chatRouter.post("/", async (req: Request, res: Response) => {
  let context = "";
  let webContext = "";
  
  try {
    const { message, conversationId, companyId, stream } = req.body as ChatRequest;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create conversation
    const convId = conversationId || uuidv4();
    const history = conversations.get(convId) || [];

    if (isGigalogyFounderQuestion(message)) {
      const fixedFounderResponse =
        "For Gigalogy, your current data clearly lists Mosleh Uddin as CEO and key leadership. In investor demos, you can present him as the primary leader of Gigalogy. If you want, I can also give you a clean 20-second founder and company intro script.";

      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: fixedFounderResponse });
      conversations.set(convId, history);

      return res.json({
        message: fixedFounderResponse,
        conversationId: convId,
      });
    }

    // Safety filter for inappropriate requests
    if (isInappropriateQuery(message)) {
      const refusal = getSafetyRefusalMessage();
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: refusal });
      conversations.set(convId, history);

      return res.json({
        message: refusal,
        conversationId: convId,
      });
    }

    // Get relevant context from RAG system
    context = searchContext(message, companyId);
    if (!context) {
      webContext = await getWebSearchContext(message);
    }

    const finalContext = [context, webContext].filter(Boolean).join("\n\n---\n\n");

    if (stream) {
      // Streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      try {
        fullResponse = await generateStreamingResponse(
          message,
          finalContext,
          history,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        );
      } catch (streamError) {
        if (!webContext) {
          throw streamError;
        }

        fullResponse = await generateStreamingResponse(
          message,
          context,
          history,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        );
      }

      // Update conversation history
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: fullResponse });
      conversations.set(convId, history);

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
      res.end();
    } else {
      // Regular response
      let response = "";
      try {
        response = normalizeAssistantText(await generateChatResponse(message, finalContext, history));
      } catch (chatError) {
        if (!webContext) {
          throw chatError;
        }

        response = normalizeAssistantText(await generateChatResponse(message, context, history));
      }

      // Update conversation history
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: response });
      conversations.set(convId, history);

      res.json({
        message: response,
        conversationId: convId,
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat request";
    
    // Provide a helpful fallback response
    let fallbackMessage = "I apologize, but I'm experiencing some technical difficulties. ";
    
    // If we have context about companies, mention that
    if (context && context.includes("Gigalogy")) {
      fallbackMessage += "I can tell you that Gigalogy is an AI and Machine Learning company that creates intelligent solutions. Their flagship product is Aira AI - a voice AI platform. Please try again in a moment for more details!";
    } else {
      fallbackMessage += "Please try again in a moment.";
    }
    
    res.status(500).json({ 
      error: errorMessage,
      message: fallbackMessage
    });
  }
});

/**
 * DELETE /api/chat/:conversationId
 * Clear conversation history
 */
chatRouter.delete("/:conversationId", (req: Request, res: Response) => {
  const { conversationId } = req.params;
  conversations.delete(conversationId);
  res.json({ success: true });
});

/**
 * GET /api/chat/:conversationId/history
 * Get conversation history
 */
chatRouter.get("/:conversationId/history", (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const history = conversations.get(conversationId) || [];
  res.json({ history, conversationId });
});
