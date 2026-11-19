# Payment Receipt (React + TS + Tailwind, Express + SQLite)

    npm install
    npm run dev      # web: http://localhost:5173  api: http://localhost:3001

- `/receipt/demo` is seeded on first run; the page also falls back to a built-in seed if the API is down.
- `GET /api/receipts`, `GET /api/receipts/:id`, `POST /api/receipts` (Zod-validated).
- Try: `curl -X POST localhost:3001/api/receipts -H 'content-type: application/json' -d '{"recipientName":"Ada L","recipientHandle":"adal","amount":250,"feeAmount":5}'`
