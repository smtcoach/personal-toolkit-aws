import { app } from "./app.js";
import { config } from "./config.js";

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`CloudDesk API listening on port ${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down`);
  server.close(error => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
