# VedaAI Assessment Creator

An AI-powered question paper generator for teachers. Tell it your subject, topic, and question types — it writes the exam. No more staying up late writing test papers.

## What it does

You fill out a simple form — subject, grade, topic, number of questions per type, difficulty level. Optionally upload a PDF or text file with your teaching material. Hit generate. In about 20–30 seconds you get a properly formatted question paper back.

The AI (Google Gemini) writes real, curriculum-relevant questions. MCQ options labeled A through D. Short answer questions with grade-appropriate wording. Even diagram labeling and graph interpretation questions when you pick those types.

Every paper comes as a student-ready printout with name/roll number fields, section headers, marks per question, and difficulty badges. You can download it as PDF, print it directly, or regenerate if you want a different set of questions.

## Architecture

```
browser                     backend                        AI
───────                     ───────                        ──
Next.js 16   ──REST/WS──▶  Express 5   ──HTTP──▶  Google Gemini
(Turbopack)                 (port 4000)              (gemini-3-flash)
    │                           │
    │                           ├── BullMQ (optional, needs Redis)
    │                           ├── MongoDB (optional, falls back to memory)
    │                           └── WebSocket (native ws, for live progress)
    │
    ├── Zustand store (persists to localStorage)
    ├── react-hook-form + Zod validation
    └── jsPDF + html2canvas for PDF export
```

### The flow when you create an assignment

1. Browser sends form data (multipart) to `POST /api/v1/assignments`
2. Backend validates, creates the assignment record, responds with 201 + `assignmentId`
3. A job starts processing — either via BullMQ (if Redis is running) or in-process
4. Every step broadcasts progress over WebSocket: 0% → 20% → 50% → 80% → 100%
5. The frontend shows a live progress bar with step indicators
6. Gemini returns structured JSON, the backend parses it into a paper
7. Frontend renders the paper as an A4-ready document

If Gemini is unavailable for any reason, it falls back to a built-in question generator so the app never breaks.

For file uploads: text files are read directly. PDFs go through `pdf-parse` to extract text. The extracted content gets passed to Gemini as reference material so questions are based on your actual teaching content.

### Monorepo structure

```
vedaai/
├── apps/
│   ├── api/          Express backend (TypeScript, port 4000)
│   │   └── src/
│   │       ├── config/       Database and Redis connections
│   │       ├── controllers/  Request handlers
│   │       ├── middleware/    Validation, file upload, error handling
│   │       ├── models/       Mongoose schemas
│   │       ├── queues/       BullMQ job queue and worker
│   │       ├── routes/       Express route definitions
│   │       ├── services/     AI calls, PDF parsing, JSON parser
│   │       ├── store.ts      Dual in-memory / MongoDB persistence
│   │       ├── websocket/    Native WebSocket server
│   │       └── utils/        Logger, custom error classes
│   │
│   └── web/          Next.js frontend (TypeScript, port 3000)
│       └── src/
│           ├── app/          Pages (/, /create, /generating, /paper/[id], /assignments)
│           ├── components/   Shared React components, icons
│           ├── hooks/        WebSocket hook with auto-reconnect
│           └── lib/          API client, Zustand store, PDF export, utilities
│
├── packages/
│   └── shared/       Types, Zod schemas, prompt builder (used by both apps)
│
├── docker-compose.yml
└── .env.example
```

## Getting started

### Prerequisites

- Node.js 22+
- npm
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

Optional but recommended for production:
- MongoDB (any version)
- Redis 7+

### Quick start (development)

```bash
git clone <repo-url>
cd vedaai
npm install
cp .env.example .env
```

Edit `.env` and set your `GEMINI_API_KEY`.

```bash
npm run dev
```

This starts both the API (port 4000) and the frontend (port 3000) concurrently.

Open http://localhost:3000 — you'll see the dashboard. Click "Create Assignment" to get started.

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview` | Model to use |
| `PORT` | No | `4000` | Backend port |
| `MONGODB_URI` | No | — | MongoDB connection string (falls back to in-memory) |
| `REDIS_URL` | No | — | Redis URL for BullMQ (falls back to in-process) |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `MAX_FILE_SIZE_MB` | No | `10` | Max file upload size |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api/v1` | Frontend API base |
| `NEXT_PUBLIC_WS_URL` | No | `ws://localhost:4000/ws` | WebSocket URL |

## Deploying for free (assignment / small project)

This setup costs $0. Three services, all on free tiers:

| Service | Platform | Free tier | What it runs |
|------|------|------|------|
| Frontend | Vercel | Unlimited deployments, 100GB bandwidth | Next.js app |
| Backend | Render | 750 hrs/month, sleeps after 15 min idle | Express API + WebSocket |
| Database | MongoDB Atlas | 512MB M0 cluster | Assignment/paper persistence |

The backend wakes up automatically when you hit it (cold start takes ~30 seconds). After that it stays responsive.

### Step 1: Get a Gemini API key

Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key. Copy it somewhere safe.

### Step 2: MongoDB Atlas (free database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up
2. Create a free M0 cluster (choose AWS, any region close to you)
3. Under "Database Access", create a user with password (note both down)
4. Under "Network Access", click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Connect" on your cluster → "Drivers" → copy the connection string
6. Replace `<username>`, `<password>` with the credentials you created

Your string will look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vedaai?retryWrites=true&w=majority`

### Step 3: Deploy the backend to Render

1. Go to [render.com](https://render.com) and sign up (use GitHub for easy deploys)
2. Push this repo to your GitHub account
3. In Render, click "New" → "Web Service" → connect your repo
4. Fill in:
   - **Name**: `vedaai-api`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx apps/api/src/server.ts`
   - **Plan**: Free
5. Under "Environment Variables", add:
   - `GEMINI_API_KEY` = your key from Step 1
   - `GEMINI_MODEL` = `gemini-3-flash-preview`
   - `MONGODB_URI` = your Atlas connection string from Step 2
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = leave empty for now (you'll come back to this)
6. Click "Create Web Service" — Render will build and deploy
7. Once deployed, copy the URL (looks like `https://vedaai-api.onrender.com`)

### Step 4: Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" → import your repo
3. Vercel will auto-detect Next.js. Configure:
   - **Framework**: Next.js
   - **Root Directory**: leave as `/`
   - **Build Command**: `next build apps/web`
   - **Output Directory**: `apps/web/.next`
4. Under "Environment Variables", add:
   - `NEXT_PUBLIC_API_URL` = `https://vedaai-api.onrender.com/api/v1`
   - (No need to set `NEXT_PUBLIC_WS_URL` — the app derives it automatically)
5. Click "Deploy"
6. Once deployed, copy the Vercel URL (looks like `https://vedaai.vercel.app`)

### Step 5: Link them together

1. Go back to your Render dashboard → `vedaai-api` → Environment → add/update:
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://vedaai.vercel.app`)
2. Render will redeploy the backend with the new setting
3. Visit your Vercel URL — everything should be live

### Mind the cold starts

Render's free tier spins down after 15 minutes of inactivity. The first request after a cold start takes 20–30 seconds because the Gemini API call runs synchronously. Subsequent requests are fast.

If you need it to stay always-on for an assignment demo, ping the health endpoint every 10 minutes with a service like [cron-job.org](https://cron-job.org) (also free) — `GET https://vedaai-api.onrender.com/api/v1/health`.

### Alternative: Render for both (simpler but slower cold starts)

If you prefer managing one platform, use the included `render.yaml`:

1. Push the repo to GitHub
2. In Render, click "New" → "Blueprint" → connect your repo
3. Render auto-detects `render.yaml` and creates both services
4. Add `GEMINI_API_KEY`, `MONGODB_URI`, and `FRONTEND_URL` as env vars
5. Both frontend and backend deploy on Render's free tier

The frontend URLs will be auto-linked via `fromService` in the blueprint. This approach has slower cold starts for the frontend than Vercel but keeps everything in one dashboard.

## Tech stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, react-hook-form, Zod, jsPDF, html2canvas

**Backend**: Express 5, TypeScript, BullMQ, Mongoose, ws (WebSocket), multer, pdf-parse

**AI**: Google Gemini (gemini-3-flash-preview) with structured prompts

**Infrastructure**: Docker Compose, MongoDB, Redis

## Why this approach

**In-memory fallback**: The app works without MongoDB or Redis. Every data store and job queue has a synchronous in-memory fallback. This means you can run it on a $5 VPS with no external dependencies beyond the Gemini API.

**WebSocket progress**: Using native `ws` instead of Socket.IO keeps the bundle small and avoids the extra protocol overhead. The frontend auto-reconnects with exponential backoff so a dropped connection mid-generation isn't a problem.

**Zustand with localStorage**: The generated paper persists across page refreshes. If a teacher accidentally closes the tab, they can come back and the paper is still there.

**Structured prompts for Gemini**: The prompt engine builds a deterministic system prompt + user prompt from the form inputs. It forces JSON-only output with explicit schema instructions, so the parser never has to guess. The fallback generator means the app never breaks even if the AI is down.

**PDF via html2canvas + jsPDF**: Not a simple screenshot — the export paginates sensibly, breaks at section boundaries, and preserves inline styles for circles and badges.

## License

MIT
