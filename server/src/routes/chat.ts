import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse, generateStreamingResponse, ChatMessage } from "../services/gemini.js";
import { searchContext } from "../services/rag.js";

export const chatRouter = Router();

// In-memory conversation store (for MVP - use Redis/DB for production)
const conversations = new Map<string, ChatMessage[]>();

interface ChatRequest {
  message: string;
  conversationId?: string;
  companyId?: string;
  stream?: boolean;
}

/**
 * POST /api/chat
 * Main chat endpoint for voice/text interactions
 */
chatRouter.post("/", async (req: Request, res: Response) => {
  let context = "";
  
  try {
    const { message, conversationId, companyId, stream } = req.body as ChatRequest;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create conversation
    const convId = conversationId || uuidv4();
    const history = conversations.get(convId) || [];

    // Get relevant context from RAG system
    context = searchContext(message, companyId);

    if (stream) {
      // Streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const fullResponse = await generateStreamingResponse(
        message,
        context,
        history,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      // Update conversation history
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: fullResponse });
      conversations.set(convId, history);

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
      res.end();
    } else {
      // Regular response
      const response = await generateChatResponse(message, context, history);

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
