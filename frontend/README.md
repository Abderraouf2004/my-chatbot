# Nova AI frontend

React 19 + TypeScript + Vite frontend for the existing `my-chatbot` Express API. It keeps the project's existing Bun/Vite setup and dependencies; no UI library is required.

## Run locally

1. Start the backend in `../backend` on port `3000`.
2. In this directory, create `.env` from `.env.example` if you need a different API URL.
3. Install dependencies and start Vite:

   ```bash
   bun install
   bun run dev
   ```

4. Open the local URL printed by Vite (normally `http://localhost:5173`).

## API integration

The frontend calls the existing endpoints:

- `POST /api/auth/signup` — `{ name, email, password }`
- `POST /api/auth/signin` — `{ email, password }`
- `GET /api/auth/verify` — bearer access token
- `POST /api/auth/refresh` and `POST /api/auth/signout` — bearer token
- `GET /api/conversation?page=1&limit=100`
- `POST /api/conversation` — `{ title }`
- `GET /api/conversation/:id/messages?page=1&limit=100`
- `POST /api/conversation/:id/messages` — `{ content }`; expects `{ data: { userMessage, assistantMessage } }`
- `PUT /api/conversation/:id` — `{ title }`
- `DELETE /api/conversation/:id`

API base URL defaults to `http://localhost:3000`. Set `VITE_API_URL` in `.env` to override it. Access and refresh tokens are stored in browser localStorage for this portfolio implementation.
