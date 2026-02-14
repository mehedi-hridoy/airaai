// Gemini Text-to-Speech Service
// High-quality, natural-sounding voices using Gemini's native TTS

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const isProduction = process.env.NODE_ENV === "production";

// Gemini TTS API response type
interface GeminiTTSResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
}

// Gemini TTS voices
export const VOICES = {
  // Female voices (recommended)
  AOEDE: "Aoede",     // Warm, conversational
  KORE: "Kore",       // Bright, energetic
  LEDA: "Leda",       // Calm, professional
  ZEPHYR: "Zephyr",   // Soft, gentle
  
  // Male voices
  CHARON: "Charon",   // Deep, authoritative
  FENRIR: "Fenrir",   // Strong, confident
  ORUS: "Orus",       // Warm, friendly
  PUCK: "Puck",       // Light, energetic
} as const;

export type VoiceId = typeof VOICES[keyof typeof VOICES];

export interface TTSOptions {
  voiceId?: VoiceId;
}

const DEFAULT_OPTIONS: Required<TTSOptions> = {
  voiceId: VOICES.AOEDE, // Great for AI assistant - warm female voice
};

export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!isProduction) {
    console.log(`🎙️ Gemini TTS: "${text.substring(0, 50)}..." with voice ${opts.voiceId}`);
  }

  const response = await fetch(
    `${GEMINI_API_URL}/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Say exactly this text out loud: "${text}"` }] 
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: opts.voiceId,
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini TTS API error:", response.status, errorText);
    throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as GeminiTTSResponse;
  
  // Extract audio from response
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioData) {
    throw new Error("No audio data in Gemini response");
  }

  // Decode base64 to buffer - this is PCM audio (L16)
  const pcmBuffer = Buffer.from(audioData, "base64");
  
  // Convert PCM to WAV format for browser playback
  const wavBuffer = pcmToWav(pcmBuffer, 24000, 1); // 24kHz mono
  
  return wavBuffer;
}

// Convert raw PCM to WAV format
function pcmToWav(pcmData: Buffer, sampleRate: number, numChannels: number): Buffer {
  const bytesPerSample = 2; // 16-bit audio
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;
  
  const buffer = Buffer.alloc(fileSize);
  
  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);
  
  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Chunk size
  buffer.writeUInt16LE(1, 20); // Audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // Byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // Block align
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // Bits per sample
  
  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);
  
  return buffer;
}

// Get available voices
export async function getVoices(): Promise<{ id: string; name: string }[]> {
  return Object.entries(VOICES).map(([name, id]) => ({
    id,
    name: name.charAt(0) + name.slice(1).toLowerCase(),
  }));
}
