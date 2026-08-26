# CloudDesk application documentation

## Overview

CloudDesk is an authenticated personal dashboard. It contains private tasks,
international news, and weather information. The backend is an Express and
TypeScript application running inside Docker on Amazon EC2.

## Frontend

The frontend is a React application in `frontend-react/`.

Important files:

- `src/App.jsx`: page layout, authentication state, and theme.
- `src/auth.js`: Cognito sign-in, sign-out, PKCE, and token refresh.
- `src/api.js`: authenticated requests to Express.
- `src/components/TasksPanel.jsx`: task interface.
- `src/components/NewsPanel.jsx`: news interface.
- `src/components/WeatherPanel.jsx`: weather interface.
- `public/config.js`: deployed AWS configuration.

## Backend

The backend is deliberately kept flat so it is easy to study:

```text
backend-express/src/
├── server.ts       Express setup, middleware, and every route
├── auth.ts         Cognito JWT verification
├── config.ts       Environment variables
├── dynamodb.ts     DynamoDB connection
├── tasks.ts        Task database functions
└── news.ts         RSS news loading
```

`server.ts` is the best place to start reading. It shows the application in
normal Express order: middleware, health route, authentication, task routes,
news route, 404 response, and error response.

## Authentication

Cognito Hosted UI uses the OAuth Authorization Code flow with PKCE. React sends
the access token with every backend request:

```text
Authorization: Bearer <access-token>
```

The authentication middleware verifies the token and stores its `sub` value as
the current user ID. The API never accepts a user ID from the browser.

## Tasks

Tasks use the following DynamoDB keys:

```text
PK = USER#{cognitoSub}
SK = TASK#{taskId}
```

A task contains:

- `taskId`
- `title`
- `completed`
- `starred`
- `priority`
- `createdAt`
- `updatedAt`

Available routes:

```text
GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:taskId
DELETE /api/v1/tasks/:taskId
```

## News

`GET /api/v1/news` loads RSS XML from a few fixed publishers, converts it to
JSON, sorts it by date, and returns up to 40 items.

The implementation is intentionally simple. It does not currently include a
cache, retries, per-feed fallbacks, or complicated error classes.

## Weather

Weather is loaded directly in the browser from Open-Meteo. City selection is
stored in browser local storage. OpenStreetMap Nominatim is used for reverse
geocoding when the user chooses browser location.

## Configuration

Backend environment variables:

```text
PORT
AWS_REGION
TASKS_TABLE_NAME
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
CORS_ORIGIN
```

Frontend runtime configuration is in `frontend-react/public/config.js`.

## Deployment

- `Deploy Express Backend` builds the Docker image in CodeBuild, pushes it to
  ECR, and replaces the container through Systems Manager.
- `Deploy Frontend` uploads the Vite build to S3 and invalidates CloudFront.
- `Deploy Cognito` updates the Cognito-only CloudFormation stack.
