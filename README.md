# 🎙️ Aira AI

<div align="center">

**LLM-Powered, Role-Based Voice Agents Operating as Digital Employees for Your Business**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#-features) •
[Architecture](#-architecture) •
[Quick Start](#-quick-start) •
[API Reference](#-api-reference) •
[Configuration](#-configuration) •
[Development](#-development)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [RAG System](#-rag-system)
- [Voice Services](#-voice-services)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Aira AI** is an advanced voice-powered AI assistant platform that combines cutting-edge LLM technology with natural speech synthesis and recognition. Built with TypeScript, it provides a robust foundation for creating intelligent, context-aware voice agents that can serve as digital employees for businesses.

### Key Capabilities

- 🗣️ **Natural Voice Conversations** - Powered by Groq's Whisper for STT and Gemini/ElevenLabs for TTS
- 🧠 **Intelligent Context Understanding** - RAG-based knowledge retrieval with company-specific customization
- 🔄 **Real-time Streaming** - Streaming chat responses for faster interaction
- 🛡️ **Built-in Safety** - Content filtering and safety guardrails
- 📚 **Multi-tenant Knowledge** - Support for multiple company knowledge bases
- 🌐 **Web Search Integration** - Fallback to web search when knowledge base lacks context
- 🎯 **Role-Based Personas** - Warm, professional, and context-aware AI personality

---

## ✨ Features

### Voice Processing
- **Speech-to-Text (STT)**: Groq Whisper Large V3 Turbo for accurate transcription
- **Text-to-Speech (TTS)**: Dual provider support (Gemini + ElevenLabs) with automatic fallback
- **Voice Selection**: 8 preset voices (4 female, 4 male) with customizable characteristics
- **Audio Optimization**: PCM to WAV conversion, natural pacing, and emotional variation

### AI Intelligence
- **LLM Integration**: Groq API with optimized system instructions
- **Conversation Management**: In-memory conversation history with context retention
- **Streaming Responses**: Server-Sent Events (SSE) for real-time chat
- **Safety Filtering**: Inappropriate content detection and refusal mechanisms

### Knowledge Management
- **RAG System**: Keyword-based semantic search with chunking and indexing
- **Company Knowledge Bases**: Multi-tenant support with JSON-based storage
- **Domain-Specific Understanding**: Specialized keywords and pattern matching
- **Web Search Fallback**: Automatic web context retrieval when needed

### Developer Experience
- **TypeScript**: Full type safety across the codebase
- **Express Server**: RESTful API with CORS support
- **Hot Reload**: Development mode with automatic reloading
- **Environment Configuration**: Flexible .env-based setup

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│                  (Voice Input/Output UI)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Aira AI Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   API Routes                          │   │
│  │  • /api/chat      • /api/tts                         │   │
│  │  • /api/stt       • /api/companies                   │   │
���  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌─────────────────────────┼──────────────────────────────┐ │
│  │              Service Layer                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │   STT    │  │   TTS    │  │   Chat   │            │ │
│  │  │ (Groq)   │  │ (Gemini/ │  │  (Groq)  │            │ │
│  │  │          │  │  11Labs) │  │          │            │ │
│  │  └──────────┘  └──────────┘  └─────��────┘            │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │   RAG    │  │  Safety  │  │   Web    │            │ │
│  │  │  System  │  │  Filter  │  │  Search  │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────┼──────────────────────────────┐ │
│  │           Knowledge Base (In-Memory)                   │ │
│  │  • Company Data Store                                  │ │
│  │  • Knowledge Chunks (indexed)                          │ │
│  │  • Conversation History                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  • Groq API (LLM + STT)                                     │
│  • Gemini API (TTS)                                         │
│  • ElevenLabs API (TTS Fallback)                            │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Voice Input** → Client captures audio → Base64 encoding
2. **STT Processing** → `/api/stt` → Groq Whisper → Text transcription
3. **RAG Retrieval** → Query analysis → Keyword matching → Context extraction
4. **LLM Processing** → `/api/chat` → Groq LLM → Response generation (streaming/non-streaming)
5. **TTS Synthesis** → `/api/tts` → Gemini/ElevenLabs → Audio buffer
6. **Voice Output** → Client plays audio response

---

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js (v22+)
- **Language**: TypeScript 5.6+
- **Framework**: Express.js 4.21+
- **Module System**: ES Modules (ESNext)

### AI & Voice Services
- **LLM**: [Groq API](https://groq.com/) (Llama/Mixtral models)
- **STT**: Groq Whisper Large V3 Turbo
- **TTS**: 
  - Primary: [Google Gemini 2.5 Flash](https://ai.google.dev/)
  - Fallback: [ElevenLabs](https://elevenlabs.io/)

### Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0",
    "@types/express": "^4.17.21"
  }
}
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed and configured:

### System Requirements
- **Node.js**: v22.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### API Keys (Required)
You'll need at least one of the following:

1. **Groq API Key** (Required for LLM & STT)
   - Sign up at [console.groq.com](https://console.groq.com/)
   - Navigate to API Keys section
   - Generate a new API key

2. **Gemini API Key** (Optional, for TTS)
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key

3. **ElevenLabs API Key** (Optional, TTS fallback)
   - Register at [elevenlabs.io](https://elevenlabs.io/)
   - Get API key from your profile

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mehedi-hridoy/airaai.git
cd airaai
```

### 2. Navigate to Server Directory

```bash
cd server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Groq API (Required for LLM + STT)
GROQ_API_KEY=your_groq_api_key_here
GROQ_STT_API_KEY=your_groq_stt_api_key_here  # Optional: separate key for STT

# Gemini API (Optional, for enhanced TTS)
GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs (Optional, TTS fallback)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Default: Rachel

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Future: Supabase Integration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Set Up Knowledge Base (Optional)

Create a `data` directory in the project root:

```bash
# From project root
mkdir -p data/companies
```

Add company knowledge files:

```bash
# Example: data/companies/gigalogy.json
{
  "id": "gigalogy",
  "name": "Gigalogy",
  "content": "Company description and knowledge...",
  "metadata": {
    "industry": "Technology",
    "website": "https://gigalogy.com",
    "lastUpdated": "2026-02-18"
  }
}
```

---

## 🚀 Quick Start

### Development Mode

Start the server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Health Check

Test if the server is running:

```bash
curl http://localhost:3001/health
```

---

## ⚙️ Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `GROQ_API_KEY` | Yes | - | Groq API key for LLM |
| `GROQ_STT_API_KEY` | No | Falls back to `GROQ_API_KEY` | Separate Groq key for STT |
| `GEMINI_API_KEY` | No | - | Google Gemini API key for TTS |
| `ELEVENLABS_API_KEY` | No | - | ElevenLabs API key for TTS |
| `ELEVENLABS_VOICE_ID` | No | `21m00Tcm4TlvDq8ikWAM` | ElevenLabs voice ID |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `DATA_DIR` | No | `./data` | Knowledge base directory |

### TTS Provider Priority

The system automatically selects TTS providers in this order:

1. **ElevenLabs** (if `ELEVENLABS_API_KEY` is set)
2. **Gemini** (if `GEMINI_API_KEY` is set)
3. **Error** (if neither is configured)

---

## 📚 API Reference

### Base URL
```
http://localhost:3001/api
```

### Authentication
Currently, the API does not require authentication. For production, implement your own auth middleware.

---

### 1. Chat Endpoint

**Send a message and receive AI response**

```http
POST /api/chat
Content-Type: application/json
```

#### Request Body

```json
{
  "message": "What is Aira AI?",
  "conversationId": "optional-conversation-id",
  "companyId": "optional-company-id",
  "stream": false
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's message |
| `conversationId` | string | No | ID to maintain conversation context |
| `companyId` | string | No | Company ID for specific knowledge base |
| `stream` | boolean | No | Enable streaming responses (SSE) |

#### Response (Non-streaming)

```json
{
  "message": "Aira AI is a LLM-powered voice agent platform...",
  "conversationId": "generated-uuid"
}
```

#### Response (Streaming)

```
Content-Type: text/event-stream

data: {"chunk":"Aira "}
data: {"chunk":"AI "}
data: {"chunk":"is "}
...
data: [DONE]
```

#### Example Usage

```javascript
// Non-streaming
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me about your capabilities',
    stream: false
  })
});
const data = await response.json();
console.log(data.message);

// Streaming
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me about your capabilities',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      const parsed = JSON.parse(data);
      console.log(parsed.chunk);
    }
  }
}
```

---

### 2. Text-to-Speech (TTS)

**Convert text to speech audio**

```http
POST /api/tts
Content-Type: application/json
```

#### Request Body

```json
{
  "text": "Hello, I am Aira, your AI assistant.",
  "voiceId": "Aoede"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to synthesize |
| `voiceId` | string | No | Voice ID (see available voices below) |

#### Available Voices

**Female Voices:**
- `Aoede` - Warm, conversational (default)
- `Kore` - Bright, energetic
- `Leda` - Calm, professional
- `Zephyr` - Soft, gentle

**Male Voices:**
- `Charon` - Deep, authoritative
- `Fenrir` - Strong, confident
- `Orus` - Warm, friendly
- `Puck` - Light, energetic

#### Response

```
Content-Type: audio/wav (Gemini) or audio/mpeg (ElevenLabs)
Content-Length: <buffer-size>

<binary audio data>
```

#### Example Usage

```javascript
const response = await fetch('http://localhost:3001/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello world',
    voiceId: 'Aoede'
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
const audio = new Audio(audioUrl);
audio.play();
```

---

### 3. Speech-to-Text (STT)

**Transcribe audio to text**

```http
POST /api/stt
Content-Type: application/json
```

#### Request Body

```json
{
  "audioBase64": "base64-encoded-audio-data",
  "mimeType": "audio/webm",
  "language": "en"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audioBase64` | string | Yes | Base64-encoded audio data |
| `mimeType` | string | No | Audio MIME type (default: `audio/webm`) |
| `language` | string | No | Language code (e.g., `en`, `es`) |

#### Response

```json
{
  "text": "Hello, how can you help me today?"
}
```

#### Example Usage

```javascript
// Capture audio from browser
const mediaRecorder = new MediaRecorder(stream);
let audioChunks = [];

mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};

mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  const reader = new FileReader();
  
  reader.onloadend = async () => {
    const base64Audio = reader.result.split(',')[1];
    
    const response = await fetch('http://localhost:3001/api/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: 'audio/webm'
      })
    });
    
    const data = await response.json();
    console.log('Transcription:', data.text);
  };
  
  reader.readAsDataURL(audioBlob);
};
```

---

### 4. Get Available Voices

**List all preset voices**

```http
GET /api/tts/preset-voices
```

#### Response

```json
{
  "voices": [
    {
      "id": "Aoede",
      "name": "Aoede",
      "description": "Warm, conversational female",
      "gender": "female"
    },
    ...
  ]
}
```

---

### 5. Company Management

**List all companies**

```http
GET /api/companies
```

#### Response

```json
{
  "companies": [
    {
      "id": "gigalogy",
      "name": "Gigalogy",
      "industry": "Technology",
      "website": "https://gigalogy.com"
    }
  ]
}
```

**Get specific company**

```http
GET /api/companies/:id
```

**Add/Update company data**

```http
POST /api/companies
Content-Type: application/json
```

```json
{
  "id": "acme-corp",
  "name": "ACME Corporation",
  "content": "Detailed company information...",
  "metadata": {
    "industry": "Manufacturing",
    "website": "https://acme.com",
    "lastUpdated": "2026-02-18"
  }
}
```

---

## 🧠 RAG System

### Overview

The RAG (Retrieval-Augmented Generation) system provides context-aware responses by retrieving relevant information from company knowledge bases and general knowledge files.

### Architecture

```
data/
├── companies/          # Company-specific knowledge
│   ├── gigalogy.json
│   └── acme.json
└── [other-files]       # General knowledge base
    ├── product-info.txt
    └── faq.md
```

### How It Works

1. **Indexing Phase** (On server start)
   - Loads all files from `data/` directory
   - Splits content into chunks (max 900 chars)
   - Extracts keywords using tokenization
   - Stores in-memory with metadata

2. **Retrieval Phase** (Per query)
   - Normalizes and tokenizes user query
   - Domain keyword expansion
   - Keyword matching with scoring
   - Levenshtein distance for typo tolerance
   - Returns top-ranked chunks

3. **Generation Phase**
   - Context injected into LLM prompt
   - Model generates response using retrieved knowledge
   - Fallback to web search if no context found

### Knowledge Chunk Structure

```typescript
{
  id: "source::index",
  source: "Gigalogy",
  section: "Product Overview",
  text: "Chunk content...",
  keywords: Set<string>
}
```

### Scoring Algorithm

```typescript
score = 
  + (keyword_match * 2)
  + (domain_keyword_match * 3)
  + (gigalogy_boost * 8)
  + (source_specificity)
```

### Adding Knowledge

**Method 1: Text/Markdown Files**

```bash
# Create file in data/ directory
echo "Product information..." > data/product-guide.md
```

**Method 2: JSON Company Data**

```bash
# Create company file
cat > data/companies/mycompany.json << EOF
{
  "id": "mycompany",
  "name": "My Company",
  "content": "Comprehensive company info...",
  "metadata": {
    "industry": "SaaS",
    "website": "https://mycompany.com",
    "lastUpdated": "2026-02-18"
  }
}
EOF
```

**Method 3: API Endpoint**

```bash
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "id": "mycompany",
    "name": "My Company",
    "content": "..."
  }'
```

### Best Practices

✅ **Do:**
- Use clear, descriptive section headers
- Keep chunks focused on single topics
- Include relevant keywords naturally
- Update metadata regularly
- Structure content hierarchically

❌ **Don't:**
- Add overly generic content
- Include duplicate information
- Use excessive boilerplate
- Exceed chunk size limits
- Mix unrelated topics

---

## 🎤 Voice Services

### Speech-to-Text (STT)

**Provider**: Groq Whisper Large V3 Turbo

**Features:**
- High accuracy multilingual transcription
- Fast processing (< 1 second typical)
- Supports multiple audio formats
- Verbose JSON response format
- Custom prompt tuning

**Supported Formats:**
- WebM (recommended for browser)
- WAV
- MP3
- M4A
- FLAC

### Text-to-Speech (TTS)

**Primary Provider**: Google Gemini 2.5 Flash TTS  
**Fallback Provider**: ElevenLabs

**Gemini TTS Features:**
- Natural conversational pacing
- Emotional variation
- 8 preset voices
- 24kHz audio quality
- PCM to WAV conversion

**ElevenLabs Features:**
- Studio-quality voices
- Low latency streaming
- Custom voice cloning (API feature)
- MP3 output format

**Voice Configuration:**

```typescript
// server/src/services/elevenlabs.ts
export const VOICES = {
  // Female
  AOEDE: "Aoede",     // Default
  KORE: "Kore",
  LEDA: "Leda",
  ZEPHYR: "Zephyr",
  
  // Male
  CHARON: "Charon",
  FENRIR: "Fenrir",
  ORUS: "Orus",
  PUCK: "Puck",
};
```

**Custom Voice Prompts:**

```typescript
// Modify in server/src/services/elevenlabs.ts
text: `Speak naturally like a warm, confident, human assistant. 
Use conversational pacing, natural pauses, and soft emotional variation. 
Avoid robotic rhythm. Text: ${cleanedText}`
```

---

## 💻 Development

### Project Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Format code
npx prettier --write "src/**/*.ts"
```

### Development Workflow

1. **Make Changes** to TypeScript files in `server/src/`
2. **Hot Reload** - `tsx watch` automatically restarts
3. **Test API** using curl, Postman, or your frontend
4. **Check Logs** in terminal for debug information
5. **Commit Changes** with clear commit messages

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

Logs include:
- API key validation
- Request/response details
- RAG search scores
- TTS provider selection
- Error stack traces

### Adding New Routes

```typescript
// server/src/routes/my-route.ts
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from my route" });
});

export default router;
```

```typescript
// server/src/dev.ts (or index.ts)
import myRoute from "./routes/my-route.js";

app.use("/api/my-route", myRoute);
```

### Testing API Endpoints

**Using cURL:**

```bash
# Chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Aira"}'

# TTS
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voiceId":"Aoede"}' \
  --output speech.wav

# STT (requires base64 audio)
curl -X POST http://localhost:3001/api/stt \
  -H "Content-Type: application/json" \
  -d '{"audioBase64":"<base64-data>"}'
```

---

## 📁 Project Structure

```
airaai/
├── server/                    # Backend server
│   ├── src/
│   │   ├── dev.ts            # Development entry point
│   │   ├── routes/           # API route handlers
│   │   │   ├── chat.ts       # Chat endpoint
│   │   │   ├── tts.ts        # Text-to-speech
│   │   │   ├── stt.ts        # Speech-to-text
│   │   │   └── companies.ts  # Company CRUD
│   │   └── services/         # Business logic
│   │       ├── gemini.ts     # LLM integration
│   │       ├── elevenlabs.ts # TTS service
│   │       ├── stt.ts        # STT service
│   │       ├── rag.ts        # RAG system
│   │       ├── safety.ts     # Content filtering
│   │       └── web-search.ts # Web search fallback
│   ├── dist/                 # Compiled JavaScript (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                  # Environment variables (gitignored)
│
├── data/                     # Knowledge base
│   ├── companies/            # Company-specific data
│   │   └── gigalogy.json
│   └── [general-knowledge]   # Text/MD files
│
├── apps/                     # Client applications (if any)
├── README.md
└── .gitignore
```

### Key Files

| File | Purpose |
|------|---------|
| `server/src/dev.ts` | Server entry point, Express setup |
| `server/src/routes/chat.ts` | Chat API with conversation management |
| `server/src/services/gemini.ts` | Groq LLM integration with streaming |
| `server/src/services/elevenlabs.ts` | TTS with Gemini/ElevenLabs |
| `server/src/services/stt.ts` | Groq Whisper STT integration |
| `server/src/services/rag.ts` | RAG indexing and retrieval |
| `server/src/services/safety.ts` | Content moderation |
| `server/src/services/web-search.ts` | Web search fallback |

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Configure production API keys
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Set up monitoring and logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Optimize knowledge base loading
- [ ] Consider database for conversation history
- [ ] Set up CDN for static assets

### Environment Setup

```env
NODE_ENV=production
PORT=3001
GROQ_API_KEY=<production-key>
GEMINI_API_KEY=<production-key>
CORS_ORIGIN=https://yourdomain.com
```

### Build and Deploy

```bash
# Build
cd server
npm run build

# Deploy dist/ folder to your server
# Ensure data/ folder is accessible

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/dev.js --name aira-ai

# Or use Docker (create Dockerfile)
docker build -t aira-ai .
docker run -p 3001:3001 --env-file .env aira-ai
```

### Recommended Hosting

- **VPS**: DigitalOcean, Linode, AWS EC2
- **Platform**: Railway, Render, Fly.io
- **Serverless**: AWS Lambda, Vercel (with limitations)

### Scaling Considerations

**For High Traffic:**
1. Replace in-memory stores with Redis/PostgreSQL
2. Implement vector database for RAG (Pinecone, Weaviate)
3. Add load balancer for multiple instances
4. Use CDN for audio delivery
5. Implement request queuing

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow TypeScript best practices
- Maintain type safety (no `any` types)
- Write descriptive commit messages
- Add comments for complex logic
- Update README for new features

### Reporting Issues

When reporting bugs, include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Relevant logs/error messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** for fast LLM inference and Whisper STT
- **Google Gemini** for advanced TTS capabilities
- **ElevenLabs** for high-quality voice synthesis
- **TypeScript** team for excellent tooling
- **Express.js** community for robust framework

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/mehedi-hridoy/airaai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mehedi-hridoy/airaai/discussions)
- **Owner**: [@mehedi-hridoy](https://github.com/mehedi-hridoy)

---

<div align="center">

**Built with ❤️ by the Aira AI Team**

[⬆ Back to Top](#-aira-ai)

</div>
