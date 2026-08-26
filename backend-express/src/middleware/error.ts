import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: "not_found",
    message: "Route not found"
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "invalid_request",
      message: "Request validation failed",
      details: error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: "internal_error",
    message: "Internal server error"
  });
};
