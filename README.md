# My Chatbot

A general-purpose AI chatbot inspired by ChatGPT.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Bun, TypeScript, Express.js
- Database: PostgreSQL
- ORM: Prisma
- Validation: Joi

## Planned Features

- User authentication
- AI-powered conversations
- Streaming responses
- Persistent chat history
- Markdown and code highlighting
- Document uploads and RAG

## Project Status

Initial project setup.

# My Chatbot — Backend

Backend API for **My Chatbot**, an AI-powered conversational application built with Bun, TypeScript, Express, PostgreSQL, Prisma, Redis, and Google Gemini.

## Tech Stack

| Technology    | Purpose                                |
| ------------- | -------------------------------------- |
| Bun           | JavaScript runtime and package manager |
| Node.js       | Production runtime                     |
| TypeScript    | Static typing                          |
| Express 5     | REST API                               |
| PostgreSQL    | Relational database                    |
| Prisma 6      | ORM and database access                |
| Redis         | Token blacklist and rate-limit storage |
| Google Gemini | AI response generation                 |
| Joi           | Request validation                     |
| Argon2        | Password hashing                       |
| JWT           | Authentication tokens                  |
| Vitest        | Automated testing                      |

## Features

- User registration and sign-in.
- JWT-based authentication using HTTP-only cookies.
- Access-token verification and refresh.
- Secure password hashing with Argon2.
- Token invalidation using Redis.
- Conversation creation, retrieval, update, and deletion.
- User and assistant messages.
- AI response generation using Google Gemini.
- Message idempotency using `Idempotency-Key`.
- Request validation with Joi.
- API rate limiting.
- Security headers with Helmet.
- CORS configuration.
- Automated unit and integration tests.

## Project Structure

```text
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── core/
│   │   ├── auth/
│   │   └── conversation/
│   ├── errors/
│   ├── modules/
│   │   ├── auth/
│   │   ├── conversation/
│   │   └── shared/
│   ├── services/
│   ├── main.ts
│   └── app.ts
├── tests/
│   ├── auth/
│   ├── conversation/
│   └── integration/
├── .env.example
├── package.json
└── tsconfig.json
```

## Requirements

- Bun
- Node.js
- PostgreSQL
- Redis
- Google Gemini API key

## Installation

Clone the repository and navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
bun install
```

Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the environment variables in `.env`.

## Environment Variables

| Variable         | Description                      |
| ---------------- | -------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string     |
| `JWT_SECRET`     | Secret used for JWT signing      |
| `REDIS_URL`      | Redis connection URL             |
| `GEMINI_API_KEY` | Google Gemini API key            |
| `FRONTEND_URL`   | Allowed frontend origin for CORS |

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/my-chatbot"
JWT_SECRET="your-secure-secret"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="your-gemini-api-key"
FRONTEND_URL="http://localhost:5173"
```

**Important:** Never commit your `.env` file or expose your secrets.

## Database Setup

Generate the Prisma Client:

```bash
bunx prisma generate
```

Apply database migrations:

```bash
bunx prisma migrate dev
```

The database uses PostgreSQL and the Prisma schema defines three main models:

- **User:** Stores user accounts and authentication-related information.
- **Conversation:** Stores conversations belonging to users.
- **Message:** Stores user and assistant messages.

Messages are associated with conversations and conversations are associated with users.

## Running the Application

Start the development server:

```bash
bun run dev
```

Build the TypeScript project:

```bash
bun run build
```

Start the production server:

```bash
bun run start
```

## API

The API uses the `/api` base path.

| Route group         | Description                         |
| ------------------- | ----------------------------------- |
| `/api/auth`         | Authentication operations           |
| `/api/conversation` | Conversation and message operations |

All protected operations require valid authentication.

## Security

The backend implements several security mechanisms:

- **Argon2:** Password hashing.
- **HTTP-only cookies:** Protect authentication tokens from direct JavaScript access.
- **JWT:** Access and refresh token authentication.
- **Redis:** Token blacklist and rate-limit storage.
- **Helmet:** HTTP security headers.
- **CORS:** Restricts allowed frontend origins.
- **Joi:** Validates incoming request data.
- **Rate limiting:** Helps protect API endpoints from excessive requests.
- **Idempotency keys:** Prevent duplicate user-message creation for repeated requests using the same key and content.

## Testing

The project uses Vitest for automated tests.

Run all tests:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Run a specific test file:

```bash
bun run test -- tests/conversation/service.test.ts
```

### Current Test Results

The current automated test suite contains **123 passing tests across 7 test files**, covering authentication, conversations, repositories, controllers, and application integration.

Build verification:

```bash
bun run build
```

## Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Start development server with watch mode |
| `bun run build`      | Compile TypeScript                       |
| `bun run start`      | Start the compiled application           |
| `bun run test`       | Run all automated tests                  |
| `bun run test:watch` | Run tests in watch mode                  |

## License

This project is currently private.
