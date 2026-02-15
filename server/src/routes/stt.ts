import { Router, Request, Response } from "express";
import { transcribeWithGroq } from "../services/stt.js";

const sttRouter = Router();

interface STTRequest {
  audioBase64: string;
  mimeType?: string;
  language?: string;
}

sttRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType, language } = req.body as STTRequest;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    const text = await transcribeWithGroq({ audioBase64, mimeType, language });
    res.json({ text });
  } catch (error) {
    console.error("STT error:", error);
    res.status(500).json({
      error: "Failed to transcribe audio",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default sttRouter;
