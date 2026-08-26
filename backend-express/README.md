# Express API

The backend uses a flat structure for easy reading:

```text
src/
├── server.ts
├── auth.ts
├── config.ts
├── dynamodb.ts
├── tasks.ts
└── news.ts
```

Start with `server.ts`. All middleware and routes are registered there.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

## Routes

```text
GET    /health
GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:taskId
DELETE /api/v1/tasks/:taskId
GET    /api/v1/news
```

Every `/api/v1` route requires a Cognito access token.

## Docker

```bash
docker build -t clouddesk-api .
docker run --env-file .env -p 3000:3000 clouddesk-api
```
