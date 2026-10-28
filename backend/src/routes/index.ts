import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import productsRoutes from "../modules/products/products.routes";
import stockRoutes from "../modules/stock/stock.routes";
import retailerOrdersRoutes from "../modules/retailer-orders/retailer-orders.routes";
import customerSubscriptionsRoutes from "../modules/customer-subscriptions/customer-subscriptions.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import { prisma } from "../config/database";

const apiRouter = Router();

// Health Checks
apiRouter.get("/health/live", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "disconnected" });
  }
});

// Feature Module Routers
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/products", productsRoutes);
apiRouter.use("/stock", stockRoutes);
apiRouter.use("/retailer-orders", retailerOrdersRoutes);
apiRouter.use("/customers", customerSubscriptionsRoutes);
apiRouter.use("/analytics", analyticsRoutes);

export default apiRouter;
