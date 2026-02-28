# TalentAI — Frontend

React-based UI for the TalentAI interview preparation platform.

## Tech Stack
- React 18
- Web Speech API (voice mode)
- PDF.js (resume parsing)
- Mammoth.js (DOCX parsing)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (needs backend running on port 8000)
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Python backend URL |

- Local: set in `.env.local`
- Production: set in Vercel dashboard → Settings → Environment Variables

## Deployment

Deployed to **Vercel**. Every push to `main` triggers an auto-deploy.

See `../talentai-backend/DEPLOYMENT.md` for full instructions.
