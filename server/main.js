import express from "express";
import { socketProvider } from "./SocketProvider";
import { Startup } from "./Startup";
import { DbConnection } from "./db/DbConfig";
import { logger } from "./utils/Logger";
import { createServer } from "http";
import { orderService } from "./services/OrderService";
import { CronJob } from "cron";
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3000;

const httpServer = createServer(app);
Startup.ConfigureGlobalMiddleware(app);
Startup.ConfigureRoutes(app);

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

socketProvider.initialize(httpServer);

DbConnection.connect();

// Delete orders from db and fs that are older than 14 days
const dailyMaintenance = new CronJob(
  "0 6 * * *",
  async () => {
    await orderService.deleteOldOrders();
  },
  null,
  true,
  "America/Denver"
);

// Create folder every morning for Print Shop to add delivered orders to
const createNewDailyFolder = new CronJob(
  "0 7 * * *",
  async () => {
    await orderService.createNewDailyFolder();
  },
  null,
  true,
  "America/Denver"
);

// Archive orders that were delivered today
const dailyArchive = new CronJob(
  "0 18 * * *",
  async () => {
    await orderService.dailyArchive();
  },
  null,
  true,
  "America/Denver"
);

// Start Server
httpServer.listen(port, () => {
  logger.log(`[SERVING ON PORT: ${port}]`);
});
