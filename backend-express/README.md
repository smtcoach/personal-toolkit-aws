# SubLens Express API

This directory contains the Node.js, Express, and TypeScript API for SubLens. The code intentionally uses a small, flat structure so the complete request flow remains easy to study.

## Structure

```text
src/
├── server.ts          middleware and routes
├── auth.ts            Cognito access-token verification
├── config.ts          environment configuration
├── dynamodb.ts        DynamoDB document client
├── tasks.ts           task data operations
└── subscription.ts    subscription data operations and AI analysis
```

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

The local API listens on `http://localhost:3000` by default. Local AWS credentials must be able to access the task and subscription tables named in `.env`.

## Environment variables

```text
PORT
AWS_REGION
TASKS_TABLE_NAME
SUBSCRIPTIONS_TABLE_NAME
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
CORS_ORIGIN
DEEPSEEK_API_KEY
```

Keep `.env` and real API keys out of source control.

## Routes

```text
GET    /health

GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:taskId
DELETE /api/v1/tasks/:taskId

POST   /api/v1/subscription/analyze
POST   /api/v1/subscription/submit
GET    /api/v1/subscription
PUT    /api/v1/subscription
DELETE /api/v1/subscription
```

`/health` is public. Every `/api/v1/*` request must provide a Cognito access token:

```http
Authorization: Bearer <access-token>
```

The analyze endpoint expects a `multipart/form-data` upload whose file field is named `screenshot`.

## Commands

```bash
npm run dev        # watch and run TypeScript locally
npm run typecheck  # check TypeScript without output
npm run build      # compile to dist/
npm start          # run the compiled API
```

## Docker

```bash
docker build -t sublens-api .
docker run --env-file .env -p 3000:3000 sublens-api
```
