import app from "./app";
import { logger } from "./lib/logger";

// Default to 8080 locally; Replit sets PORT automatically via the environment.
const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const startServer = (listenPort: number): void => {
  app.listen(listenPort, (err?: Error) => {
    if (err) {
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        logger.warn({ port: listenPort }, "Port already in use, trying next available port");
        startServer(listenPort + 1);
        return;
      }

      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port: listenPort }, "Server listening");
  });
};

startServer(port);
