import { Router, Request, Response } from "express";
import { textToSpeech, getVoices, VOICES, VoiceId } from "../services/elevenlabs.js";

const router = Router();

// POST /api/tts - Generate speech from text
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceId } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    // Validate voice ID if provided
    const validVoiceIds = Object.values(VOICES);
    const selectedVoice: VoiceId = voiceId && validVoiceIds.includes(voiceId) 
      ? voiceId 
      : VOICES.AOEDE; // Default to Aoede - warm female voice

    const tts = await textToSpeech(text, { voiceId: selectedVoice });

    // Set appropriate headers for audio format from provider
    res.set({
      "Content-Type": tts.mimeType,
      "Content-Length": tts.audioBuffer.length.toString(),
      "Cache-Control": "no-cache",
    });

    res.send(tts.audioBuffer);
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({ 
      error: "Failed to generate speech",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/tts/voices - List available voices
router.get("/voices", async (_req: Request, res: Response): Promise<void> => {
  try {
    const voices = await getVoices();
    res.json({ voices });
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

// GET /api/tts/preset-voices - Get preset voice options
router.get("/preset-voices", (_req: Request, res: Response): void => {
  const presetVoices = [
    { id: VOICES.AOEDE, name: "Aoede", description: "Warm, conversational female", gender: "female" },
    { id: VOICES.KORE, name: "Kore", description: "Bright, energetic female", gender: "female" },
    { id: VOICES.LEDA, name: "Leda", description: "Calm, professional female", gender: "female" },
    { id: VOICES.ZEPHYR, name: "Zephyr", description: "Soft, gentle female", gender: "female" },
    { id: VOICES.CHARON, name: "Charon", description: "Deep, authoritative male", gender: "male" },
    { id: VOICES.FENRIR, name: "Fenrir", description: "Strong, confident male", gender: "male" },
    { id: VOICES.ORUS, name: "Orus", description: "Warm, friendly male", gender: "male" },
    { id: VOICES.PUCK, name: "Puck", description: "Light, energetic male", gender: "male" },
  ];
  
  res.json({ voices: presetVoices });
});

export default router;
