import cors from "cors";
import express from "express";
import multer from "multer";
import { authenticate, type UserRequest } from "./auth.js";
import { config } from "./config.js";
import { getNews } from "./news.js";
import dayjs from 'dayjs';
import {
  addTask,
  editTask,
  getTasks,
  removeTask,
  type TaskChanges,
  type TaskPriority
} from "./tasks.js";
import { KeyObject } from "crypto";
import { addSubscription } from "./subscription.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "clouddesk-api" });
});

// Everything below this line requires a Cognito access token.
app.use("/api/v1", authenticate);

app.get("/api/v1/tasks", async (req, res) => {
  const userId = (req as UserRequest).userId!;
  res.json(await getTasks(userId));
});

app.post("/api/v1/tasks", async (req, res) => {
  const userId = (req as UserRequest).userId!;
  const title = String(req.body.title || "").trim();
  const priority = req.body.priority || "normal";

  if (!title) {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  if (!["low", "normal", "high"].includes(priority)) {
    res.status(400).json({ message: "Priority must be low, normal, or high" });
    return;
  }

  const task = await addTask(userId, title, priority as TaskPriority);
  res.status(201).json({ message: "Task created", task });
});

app.patch("/api/v1/tasks/:taskId", async (req, res) => {
  const userId = (req as UserRequest).userId!;
  const changes: TaskChanges = {};

  if (typeof req.body.title === "string" && req.body.title.trim()) {
    changes.title = req.body.title.trim();
  }
  if (typeof req.body.completed === "boolean") {
    changes.completed = req.body.completed;
  }
  if (typeof req.body.starred === "boolean") {
    changes.starred = req.body.starred;
  }
  if (["low", "normal", "high"].includes(req.body.priority)) {
    changes.priority = req.body.priority;
  }

  if (Object.keys(changes).length === 0) {
    res.status(400).json({ message: "Send at least one task field to update" });
    return;
  }

  const task = await editTask(userId, req.params.taskId, changes);

  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  res.json({ message: "Task updated", task });
});

app.delete("/api/v1/tasks/:taskId", async (req, res) => {
  const userId = (req as UserRequest).userId!;
  await removeTask(userId, req.params.taskId);
  res.json({ message: "Task deleted" });
});

app.get("/api/v1/news", async (_req, res) => {
  res.json({ items: await getNews() });
});

const upload = multer({
  storage: multer.memoryStorage()
});

app.post('/api/v1/subscription/analyze',
  upload.single("screenshot"),
  async (req, res, next) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "No image uploaded"
      });
    }
    console.log("Filename:", file.originalname);
    console.log("Type:", file.mimetype);
    console.log("Size:", Math.trunc((file.size) / 1000), 'KB');
    const example = {
      name: 'netflex',
      cost: '$21/month',
      date: dayjs().format('YYYY, DD')
    }


    return res.status(201).json(example);
  });

app.post('/api/v1/subscription/submit', async (req, res, next) => {
  const userId = (req as UserRequest).userId!;
  console.log(req.body);
  const name = req.body.name;
  const cost = req.body.cost;
  const date = req.body.date;
  const entry = await addSubscription(userId, name, cost, date);
  console.log(entry);
  res.status(201).json({
    message: 'successfully submit',
    data: entry
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`CloudDesk API is running on port ${config.port}`);
});
