# Vishal AI

**Highly Intelligent, Real-Time AI Assistant & API Platform.**

Vishal AI is a production-grade AI ecosystem that combines a beautiful, real-time chatbot interface with a powerful API infrastructure. Build once, and power every website, chatbot, tool, and app with a single AI platform that thinks deeper, searches live, and remembers you.

## 🚀 Key Features

- 🌐 **Real-Time Intelligence** — Integrated with Brave Search and Serper.dev for up-to-the-minute factual accuracy.
- 🧠 **Dynamic Personalization** — Remembers user names, preferences, and communication tones via a dedicated memory system.
- ⚡ **Ultra-Fast Inference** — Powered by Groq (LLaMA 3.3 70B) for sub-second, intelligent responses.
- 🎭 **Smart Query Routing** — Automatically classifies intent (Search, Coding, Reasoning, General) to provide the best response style.
- 🔑 **API Key Management** — Generate, rename, revoke, and track production-ready API keys.
- ⌨️ **Premium UX** — Smooth, character-by-character typing effects and dark glassmorphism design.
- 🔒 **Enterprise Grade** — SHA-256 hashed keys, rate limiting, and secure database isolation.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Logic** | Tailwind CSS & Framer Motion |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google + Email) |
| **Intelligence** | Groq (LLaMA 3.3 70B) |
| **Live Search** | Brave Search / Serper.dev |

---

## ⚡ Setup Guide

### 1. Clone and Install

```bash
cd vishal-ai
npm install
```

### 2. Database Configuration

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL initialization found in `database/schema.sql` (and its updates).
3. Ensure the `profiles` table has the `preferences` JSONB column.

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `SERPER_API_KEY` (For Google Search results)
- `BRAVE_SEARCH_API_KEY` (Optional alternative)

### 4. Developer Run

```bash
npm run dev
```

---

## 📡 API Integration

### Chat Completions (OpenAI Compatible)

```bash
curl -X POST https://your-domain.com/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer vk-your-api-key" \
  -d '{
    "messages": [
      {"role": "user", "content": "Who is the current Prime Minister of India?"}
    ]
  }'
```

*Note: The platform automatically handles live web searching for factual queries.*

---

## 📂 Architecture

```
src/
├── app/
│   ├── api/v1/           # High-performance API endpoints
│   ├── (dashboard)/      # Intelligent management area
│   └── (auth)/           # Secure onboarding flow
├── lib/
│   ├── classifier.ts     # Query intent categorization
│   ├── search.ts         # Real-time search orchestration
│   ├── groq.ts           # LLM integration
│   └── supabase/         # Database & Auth clients
└── components/           # Framer-powered UI elements
```

---

## 📈 Roadmap

- [ ] Multi-Model "Brain" Selection (DeepSeek, Claude 3.5, GPT-4o)
- [ ] Document/PDF Knowledge Base Integration
- [ ] Team Workspace Collaboration
- [ ] Voice Synthesis & Input
- [ ] Streaming API Support

**Powered by Vishal AI** © 2026
