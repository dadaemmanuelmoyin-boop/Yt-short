# Payment Receipt (React + TS + Tailwind, Express + SQLite)

## Frontend only (what Vercel deploys)
    npm install
    npm run dev        # http://localhost:5173
Without the API the page shows a built-in demo receipt.

## With the API (local)
    cd server && npm install && npm run dev     # http://localhost:3001
    npm run dev                                 # in the project root, proxies /api

Endpoints: `GET /api/receipts`, `GET /api/receipts/:id`, `POST /api/receipts` (Zod-validated).

## Vercel
Root Directory = `receipt-app`. `vercel.json` handles the SPA rewrite; Node is pinned to 22.
