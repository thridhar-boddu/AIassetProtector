# AssetGuardian — Production Deployment Guide

> [!IMPORTANT]
> All secrets live in **environment variables only** — never in source code or `git`.

---

## What Changed

| Area | Before | After |
|---|---|---|
| Database | H2 (in-memory, lost on restart) | **PostgreSQL** via `DATABASE_URL` env var |
| CORS | Hardcoded `localhost` | `ALLOWED_ORIGINS` env var (comma-separated) |
| AI Service | Hardcoded `host=0.0.0.0 port=8000` | `HOST` / `PORT` env vars + CORS middleware |
| Groq API Key | User must paste manually every time | `VITE_GROQ_API_KEY` env var pre-populates it |
| Vite proxy | Hardcoded `localhost:8080` | `VITE_API_URL` env var |
| Secrets safety | No `.gitignore` for `.env` | Root `.gitignore` blocks all `.env*` (keeps `.env.example`) |

---

## Step 1 — Free PostgreSQL Database (Neon.tech)

1. Go to [neon.tech](https://neon.tech) → **New Project**
2. Copy the **Connection string** (looks like `postgresql://user:pass@host/dbname?sslmode=require`)
3. Change the scheme to `jdbc:postgresql://...` (drop the `postgresql://` prefix → add `jdbc:` prefix)
---


## Step 2 — Deploy Java Backend (Render)

1. Push your code to GitHub
2. [render.com](https://render.com) → **New Web Service** → connect repo → set:
   - **Root directory**: `backend`
   - **Build command**: `./mvnw clean package -DskipTests`
   - **Start command**: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
3. Add **Environment Variables** in Render dashboard:

```
DATABASE_URL      jdbc:postgresql://<neon-host>/<dbname>?sslmode=require
DB_USERNAME       <neon-user>
DB_PASSWORD       <neon-password>
ALLOWED_ORIGINS   https://your-frontend.vercel.app
PORT              (Render sets this automatically — leave blank)
AI_SERVICE_URL    https://your-ai-service.onrender.com
```

---

## Step 3 — Deploy Python AI Service (Render)

1. **New Web Service** → same repo → set:
   - **Root directory**: `ai-service`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
2. Add **Environment Variables**:

```
ALLOWED_ORIGINS   https://your-backend.onrender.com
```

> [!NOTE]
> The AI service only needs to allow calls from the **Java backend**, not the frontend directly.

---

## Step 4 — Deploy React Dashboard (Vercel)

1. [vercel.com](https://vercel.com) → **New Project** → connect repo
2. Set **Root directory** to `dashboard`
3. Add **Environment Variables** in Vercel project settings:

```
VITE_GROQ_API_KEY   gsk_xxxxxxxxxxxxxxxxxxxx   (your Groq key)
VITE_API_URL        https://your-backend.onrender.com
```

> [!TIP]
> In Vercel's production build the `/api` proxy doesn't run — the dashboard calls the backend **directly** via `VITE_API_URL`. Make sure `ALLOWED_ORIGINS` on your backend includes your Vercel URL.

---

## Step 5 — Local Development (Quick Start)

```powershell
# 1. Backend
cd backend
copy .env.example .env   # fill in your Neon DB creds
# Load vars into shell:
Get-Content .env | ForEach-Object {
    $k, $v = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
}
.\run_backend.ps1

# 2. AI Service
cd ..\ai-service
python -m venv venv && .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py

# 3. Dashboard
cd ..\dashboard
copy .env.example .env.local   # fill in VITE_GROQ_API_KEY
npm install && npm run dev
```

---

## Environment Variable Reference

### Backend (`backend/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | JDBC PostgreSQL connection string |
| `DB_USERNAME` | ✅ | Database user |
| `DB_PASSWORD` | ✅ | Database password |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend URLs for CORS |
| `PORT` | auto | Injected by Render/Railway; defaults to 8080 |
| `AI_SERVICE_URL` | optional | URL of the Python detection service |

### AI Service (`ai-service/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `HOST` | optional | Bind address; defaults to `0.0.0.0` |
| `PORT` | auto | Injected by platform; defaults to `8000` |
| `ALLOWED_ORIGINS` | ✅ | URLs allowed to call this service |

### Dashboard (`dashboard/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | local dev | Vite proxy target; defaults to `localhost:8080` |
| `VITE_GROQ_API_KEY` | optional | Pre-populates the AI assistant — skip for manual entry |

---

> [!WARNING]
> Spring Boot's `spring.jpa.hibernate.ddl-auto=update` will auto-create tables on first run. For production beyond the demo, switch to `validate` and use Flyway migrations.
