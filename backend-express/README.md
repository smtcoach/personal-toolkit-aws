# CloudDesk Express API

This directory contains the replacement Tasks API built with Express, TypeScript,
Amazon Cognito, and DynamoDB. It runs alongside the existing Lambda backend during
the migration.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Fill `.env` with the existing Cognito user pool, app client, and DynamoDB table
values before starting the API.

The local endpoints are:

```text
GET    http://localhost:3000/health
GET    http://localhost:3000/api/v1/tasks
POST   http://localhost:3000/api/v1/tasks
PATCH  http://localhost:3000/api/v1/tasks/:taskId
DELETE http://localhost:3000/api/v1/tasks/:taskId
```

All task routes require a Cognito access token:

```text
Authorization: Bearer <access-token>
```

## Docker

```bash
docker build -t clouddesk-api .
docker run --env-file .env -p 3000:3000 clouddesk-api
```

For local Docker Compose usage, create `.env`, then run:

```bash
docker compose up --build
```

In AWS, the container will use the EC2 instance role for DynamoDB credentials.
Do not store AWS access keys in `.env`.
