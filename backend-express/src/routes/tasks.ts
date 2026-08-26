import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.js";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask
} from "../services/tasks.js";
import type { AuthenticatedRequest } from "../types.js";

const prioritySchema = z.enum(["low", "normal", "high"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  priority: prioritySchema.default("normal")
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    completed: z.boolean().optional(),
    starred: z.boolean().optional(),
    priority: prioritySchema.optional()
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: "At least one task field is required"
  });

export const tasksRouter = Router();

function getUserId(req: AuthenticatedRequest): string {
  if (!req.auth?.userId) {
    throw new AppError(401, "authentication_required", "Authentication required");
  }
  return req.auth.userId;
}

tasksRouter.get("/", async (req, res) => {
  const tasks = await listTasks(getUserId(req as AuthenticatedRequest));
  res.json(tasks);
});

tasksRouter.post("/", async (req, res) => {
  const input = createTaskSchema.parse(req.body);
  const task = await createTask(getUserId(req as AuthenticatedRequest), input);
  res.status(201).json({ message: "Task created", task });
});

tasksRouter.patch("/:taskId", async (req, res) => {
  const input = updateTaskSchema.parse(req.body);
  const task = await updateTask(
    getUserId(req as AuthenticatedRequest),
    req.params.taskId,
    input
  );
  res.json({ message: "Task updated", task });
});

tasksRouter.delete("/:taskId", async (req, res) => {
  await deleteTask(getUserId(req as AuthenticatedRequest), req.params.taskId);
  res.json({ message: "Task deleted" });
});
