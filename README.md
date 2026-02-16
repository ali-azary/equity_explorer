

# Equity Explorer

A lightweight React + Vite app for exploring equity data (price history, fundamentals, news, corporate actions, analyst recommendations, and holders) plus a few quantitative tools (AI SWOT, VaR/ES, volatility & correlation lab).

Not financial advice.

## Features

Data views (per ticker)

- History (period + interval)
- Company profile (info)
- News headlines
- Corporate actions
- Financial statements
- Analyst recommendations
- Holders / ownership

Tools

- AI SWOT analysis (Gemini)
- Portfolio Risk Engine: historical VaR / Expected Shortfall (VaR/ES)
- Volatility & Correlation Lab: realized or EWMA “GARCH-lite”, correlation matrix, regime timeline

## Tech stack

- React 19 + TypeScript
- Vite 6
- Google GenAI SDK (`@google/genai`) for the SWOT tool

## Data source and CORS

Market / company data is fetched from a hosted yfinance-style API:

- Base API: `https://yf-api-c0nm.onrender.com`

Requests are made directly from the browser (no public CORS proxy). The API must therefore return appropriate CORS headers. If you self-host, enable CORS on your API and update `API_BASE` in `services/stockService.ts`.

## Local setup

Prerequisites

- Node.js 18+ (recommended)
1) Install

```bash
npm install
```

2) Configure environment variables

Create `.env.local` in the project root:

```bash
GEMINI_API_KEY=YOUR_KEY_HERE
```

Notes

- The app maps `GEMINI_API_KEY` into `process.env.API_KEY` / `process.env.GEMINI_API_KEY` via `vite.config.ts`.

- Only the SWOT tool needs this key. All other views/tools work without it.
3) Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build locally
```

## Project structure

- `App.tsx` — layout, routing between views, history controls
- `services/stockService.ts` — API calls + multi-ticker history alignment/forward-fill
- `components/` — UI components and tools
- `utils/` — CSV/JSON export helpers
- `types.ts` — shared TypeScript types

## Troubleshooting

- “Could Not Load Data” / empty responses: verify the ticker symbol and try another view (some endpoints may not exist for all tickers).
- CORS/network errors: the hosted API may be rate-limited/down or not sending the required CORS headers. Point `API_BASE` in `services/stockService.ts` to your own API (with CORS enabled) for a more reliable setup.
- SWOT tool errors: confirm `GEMINI_API_KEY` is set in `.env.local` and restart `npm run dev`.

## License

Add a license file if you plan to publish/distribute this project (e.g., MIT, Apache-2.0).
