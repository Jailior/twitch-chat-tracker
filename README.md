# Twitch Chat Tracker

Tracks the most common word in Twitch chat for a fixed list of streamers. Node.js backend ingests IRC chat, stores live counts in Redis, snapshots to Postgres, and exposes REST endpoints. Next.js frontend shows current top words and recent history.

## Structure
- `backend/` — Node.js + TypeScript service (IRC ingest, Redis, Postgres, REST)
- `frontend/` — Next.js (app router) UI deployed to Vercel

## Local setup
1. Backend
   ```bash
   cd backend
   npm install
   cp example.env .env    # fill in Twitch + Redis + Postgres values
   npm run dev            # or npm run build && npm start
   ```
2. Frontend
   ```bash
   cd frontend
   npm install
   cp example.env .env.local   # point NEXT_PUBLIC_API_BASE at backend
   npm run dev
   ```

## Backend endpoints
- `GET /health`
- `GET /channels`
- `GET /top-words?channel=foo&limit=1`
- `GET /history?channel=foo&limit=50`

## Deployment
- Backend: build Docker image (`backend/Dockerfile`) and deploy to AWS Lightsail container service; supply environment for Redis, Postgres (managed), and Twitch IRC credentials.
- Frontend: deploy `frontend/` to Vercel; set `NEXT_PUBLIC_API_BASE` to the backend public URL.

## Smoke testing
- Backend: `curl http://localhost:4000/health` then `curl http://localhost:4000/top-words`.
- Frontend: `npm run dev` in `frontend/` and open `http://localhost:3000`.
