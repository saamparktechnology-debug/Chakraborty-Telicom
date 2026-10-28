import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { logger } from "./config/logger";

const server = app.listen(env.PORT, () => {
  logger.info(
    `Amul Party Backend API running on http://localhost:${env.PORT}${env.API_PREFIX}`,
    {
      env: env.NODE_ENV,
    },
  );
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Closing HTTP server and Prisma pool...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
