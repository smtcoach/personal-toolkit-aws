import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  AWS_REGION: z.string().min(1).default("us-east-2"),
  TASKS_TABLE_NAME: z.string().min(1),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:8000"),
  DYNAMODB_ENDPOINT: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map(issue => issue.path.join(".")).join(", ");
  throw new Error(`Invalid environment configuration: ${missing}`);
}

export const config = {
  port: parsed.data.PORT,
  awsRegion: parsed.data.AWS_REGION,
  tasksTableName: parsed.data.TASKS_TABLE_NAME,
  cognitoUserPoolId: parsed.data.COGNITO_USER_POOL_ID,
  cognitoClientId: parsed.data.COGNITO_CLIENT_ID,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map(origin => origin.trim()),
  dynamodbEndpoint: parsed.data.DYNAMODB_ENDPOINT
};
