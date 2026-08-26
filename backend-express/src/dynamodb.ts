import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "./config.js";

const client = new DynamoDBClient({
  region: config.awsRegion
});

export const dynamodb = DynamoDBDocumentClient.from(client);
