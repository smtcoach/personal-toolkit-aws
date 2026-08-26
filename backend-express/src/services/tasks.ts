import { randomUUID } from "node:crypto";
import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import { config } from "../config.js";
import { dynamodb } from "../lib/dynamodb.js";
import { AppError } from "../middleware/error.js";
import type { Task, TaskPriority } from "../types.js";

interface TaskItem extends Task {
  PK: string;
  SK: string;
  userId: string;
}

export interface CreateTaskInput {
  title: string;
  priority: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: TaskPriority;
}

function taskPk(userId: string): string {
  return `USER#${userId}`;
}

function taskSk(taskId: string): string {
  return `TASK#${taskId}`;
}

function toPublicTask(item: TaskItem): Task {
  return {
    taskId: item.taskId,
    title: item.title,
    completed: Boolean(item.completed),
    starred: Boolean(item.starred),
    priority: item.priority || "normal",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function isConditionalFailure(error: unknown): boolean {
  return error instanceof Error && error.name === "ConditionalCheckFailedException";
}

export async function listTasks(userId: string): Promise<Task[]> {
  const response = await dynamodb.send(
    new QueryCommand({
      TableName: config.tasksTableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :taskPrefix)",
      ExpressionAttributeValues: {
        ":pk": taskPk(userId),
        ":taskPrefix": "TASK#"
      }
    })
  );

  return ((response.Items || []) as TaskItem[])
    .map(toPublicTask)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const taskId = randomUUID();
  const now = new Date().toISOString();
  const item: TaskItem = {
    PK: taskPk(userId),
    SK: taskSk(taskId),
    userId,
    taskId,
    title: input.title,
    completed: false,
    starred: false,
    priority: input.priority,
    createdAt: now,
    updatedAt: now
  };

  await dynamodb.send(
    new PutCommand({
      TableName: config.tasksTableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
    })
  );

  return toPublicTask(item);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };
  const assignments = ["#updatedAt = :updatedAt"];

  for (const [field, value] of Object.entries(input)) {
    names[`#${field}`] = field;
    values[`:${field}`] = value;
    assignments.push(`#${field} = :${field}`);
  }

  try {
    const response = await dynamodb.send(
      new UpdateCommand({
        TableName: config.tasksTableName,
        Key: { PK: taskPk(userId), SK: taskSk(taskId) },
        UpdateExpression: `SET ${assignments.join(", ")}`,
        ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW"
      })
    );

    return toPublicTask(response.Attributes as TaskItem);
  } catch (error) {
    if (isConditionalFailure(error)) {
      throw new AppError(404, "task_not_found", "Task not found");
    }
    throw error;
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  try {
    await dynamodb.send(
      new DeleteCommand({
        TableName: config.tasksTableName,
        Key: { PK: taskPk(userId), SK: taskSk(taskId) },
        ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)"
      })
    );
  } catch (error) {
    if (isConditionalFailure(error)) {
      throw new AppError(404, "task_not_found", "Task not found");
    }
    throw error;
  }
}
