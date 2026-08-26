import type { Request } from "express";

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

export interface AuthenticatedUser {
  userId: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUser;
}
