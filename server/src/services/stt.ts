const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

interface TranscribeParams {
  audioBase64: string;
  mimeType?: string;
  language?: string;
}

interface GroqTranscriptionResponse {
  text?: string;
}

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("m4a")) return "m4a";
  return "webm";
}

export async function transcribeWithGroq({
  audioBase64,
  mimeType = "audio/webm",
  language,
}: TranscribeParams): Promise<string> {
  const apiKey = process.env.GROQ_STT_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_STT_API_KEY or GROQ_API_KEY environment variable is not set");
  }

  const buffer = Buffer.from(audioBase64, "base64");
  if (!buffer.length) {
    throw new Error("Invalid audio payload");
  }

  const ext = mimeToExtension(mimeType);
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append("file", blob, `voice-input.${ext}`);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("temperature", "0");
  formData.append("response_format", "verbose_json");
  formData.append(
    "prompt",
    "Conversation with Aira AI assistant. Important words: Aira, Gigalogy, Maira, G-Core, SmartAds, Personalizer, Technopreneurship, Mosleh Uddin, Moin Uddin.",
  );

  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq STT error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GroqTranscriptionResponse;
  const text = data.text?.trim();

  if (!text) {
    throw new Error("No transcription text returned from Groq");
  }

  return text;
}
