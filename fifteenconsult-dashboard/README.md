# FifteenConsult — AI Marketing Department

A live dashboard for FifteenConsult's 7 AI marketing agents, powered by Claude.

## What It Does

- **7 AI agents** — each with a dedicated persona, KPIs, tasks, and system prompt
- **Live briefings** — each agent calls the Claude API and streams their daily/weekly output
- **Run All** — trigger all 7 agents sequentially from one button
- **Weekly Summary** — aggregated view of all agent outputs
- **Persistent storage** — outputs and task states survive page refresh

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Deploy to Vercel (Step-by-Step)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — FifteenConsult AI Department"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fifteenconsult-dashboard.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `fifteenconsult-dashboard` repo
4. Vercel auto-detects Vite — no config needed
5. Click **Deploy**

Your live URL will be: `https://fifteenconsult-dashboard.vercel.app`

### 3. Custom Domain (Optional)

In Vercel project settings → Domains → add `dashboard.fifteenconsult.com`

---

## Project Structure

```
fifteenconsult-dashboard/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Main application
    ├── index.css         # Global styles + CSS variables
    ├── data/
    │   └── team.js       # All 7 agent definitions
    ├── lib/
    │   ├── api.js        # Anthropic API streaming
    │   └── storage.js    # localStorage persistence
    └── components/
        ├── KpiBar.jsx
        ├── OutputLog.jsx
        ├── MemberCard.jsx
        ├── MemberDetail.jsx
        └── WeeklySummary.jsx
```

---

## Adding or Editing Agents

All agent data lives in `src/data/team.js`. Each agent object has:

- `id` — unique identifier
- `name`, `role`, `emoji`, `color` — display
- `cadence` — `"daily"` or `"weekly"`
- `briefingTrigger` — the message sent to Claude to start the briefing
- `systemPrompt` — the full Claude system prompt for that persona
- `kpis` — array of `{ label, target, current, unit? }`
- `tasks` — array of `{ text, done }`

---

## Notes

- The Anthropic API key is injected automatically by the Claude.ai hosting environment
- All briefing outputs are stored in `localStorage` under key `fc_dept_v3`
- To reset all data: open browser console → `localStorage.clear()` → refresh
- Zara (Analytics) is set to `weekly` cadence; all others are `daily`
