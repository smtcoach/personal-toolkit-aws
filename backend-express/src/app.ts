import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { tasksRouter } from "./routes/tasks.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: config.corsOrigins.includes("*") ? true : config.corsOrigins
  })
);
app.use(express.json({ limit: "50kb" }));

app.use("/health", healthRouter);
app.use("/api/v1/tasks", authenticate, tasksRouter);

app.use(notFound);
app.use(errorHandler);
