import { randomUUID } from "node:crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { config } from "./config.js";
import { dynamodb } from "./dynamodb.js";

export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  taskId: string;
  title: string;
  completed: boolean;
  starred: boolean;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TaskChanges {
  title?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: TaskPriority;
}

interface TaskItem extends Task {
  PK: string;
  SK: string;
}

function taskKey(userId: string, taskId: string) {
  return {
    PK: `USER#${userId}`,
    SK: `TASK#${taskId}`
  };
}

function removeDatabaseKeys(item: TaskItem): Task {
  return {
    taskId: item.taskId,
    title: item.title,
    completed: item.completed,
    starred: item.starred,
    priority: item.priority || "normal",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export async function getTasks(userId: string): Promise<Task[]> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: config.tasksTableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`
      }
    })
  );

  const tasks = (result.Items || []) as TaskItem[];
  return tasks
    .map(removeDatabaseKeys)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addTask(
  userId: string,
  title: string,
  priority: TaskPriority
): Promise<Task> {
  const taskId = randomUUID();
  const now = new Date().toISOString();
  const item: TaskItem = {
    ...taskKey(userId, taskId),
    taskId,
    title,
    completed: false,
    starred: false,
    priority,
    createdAt: now,
    updatedAt: now
  };

  await dynamodb.send(
    new PutCommand({
      TableName: config.tasksTableName,
      Item: item
    })
  );

  return removeDatabaseKeys(item);
}

export async function editTask(
  userId: string,
  taskId: string,
  changes: TaskChanges
): Promise<Task | null> {
  const key = taskKey(userId, taskId);
  const result = await dynamodb.send(
    new GetCommand({
      TableName: config.tasksTableName,
      Key: key
    })
  );

  if (!result.Item) {
    return null;
  }

  const updatedItem: TaskItem = {
    ...(result.Item as TaskItem),
    ...changes,
    updatedAt: new Date().toISOString()
  };

  await dynamodb.send(
    new PutCommand({
      TableName: config.tasksTableName,
      Item: updatedItem
    })
  );

  return removeDatabaseKeys(updatedItem);
}

export async function removeTask(userId: string, taskId: string): Promise<void> {
  await dynamodb.send(
    new DeleteCommand({
      TableName: config.tasksTableName,
      Key: taskKey(userId, taskId)
    })
  );
}
