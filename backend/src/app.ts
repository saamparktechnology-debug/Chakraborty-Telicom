import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import apiRouter from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve multi-angle product images from /uploads/products/*
const uploadsRoot = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsRoot));
app.use("/api/uploads", express.static(uploadsRoot));

app.use("/api", apiRouter);

app.use(errorHandler);

export default app;
