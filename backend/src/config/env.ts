import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("/api"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("dev_only_access_secret_change_in_prod_64_bytes_minimum"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("dev_only_refresh_secret_change_in_prod_64_bytes_minimum"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("8h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  SKIP_DAY_CUTOFF_HOUR_IST: z.coerce.number().min(0).max(23).default(21),
  SKIP_DAY_CUTOFF_MINUTE_IST: z.coerce.number().min(0).max(59).default(0),
  NEGATIVE_WALLET_POLICY: z.enum(["BLOCK", "ALLOW"]).default("BLOCK"),
  LOW_WALLET_THRESHOLD_INR: z.coerce.number().positive().default(150.0),
  INVOICE_NUMBER_PREFIX: z.string().default("INV-2026-"),
  CUSTOMER_BILL_PREFIX: z.string().default("BILL-2026-"),
  SMS_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
