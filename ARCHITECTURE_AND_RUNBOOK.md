# Amul Party Distribution & Subscription Management Platform
## Architecture, Security, Database Operations & Deployment Runbook

### 1. System Architecture Overview
The platform is structured as a modular monorepo with three strictly separated deliverable components:
1. **`backend/` (Node.js 20+, Express.js, TypeScript, Prisma ORM, MySQL 8.0+ InnoDB)**:
   - Exposes 19 versioned REST endpoints under `/api` documented in `backend/openapi.yaml`.
   - Enforces authentication (Argon2id/scrypt password hashing, short-lived JWT access tokens + rotating refresh sessions, HttpOnly/SameSite cookies + Bearer support for Android APK), role-based access control (`ADMIN`, `DSE`, `RETAILER`, `CUSTOMER`), resource ownership guards, and rate limiting.
   - Executes all money movements inside ACID `REPEATABLE-READ` database transactions (`prisma.$transaction`) using integer Paise (`BigInt`) arithmetic so floating-point rounding drift is impossible.
2. **`admin-web/` (Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Table v8, jsPDF)**:
   - Provides `/login`, `/overview`, `/products`, `/dse-management`, `/retailers`, `/indents-billing`, and `/customers`.
3. **`mobile-app/` (React Native, Expo SDK 51+, Expo Router, TypeScript, Zustand, TanStack Query v5, Expo SecureStore)**:
   - Single signed Android APK delivering role-isolated screens for **DSE**, **Retailer**, and **Customer**.

### 2. Service-Level Objectives (SLOs) & Reliability Targets
- **Availability SLO**: `99.5%` monthly uptime during core dairy dispatch & billing hours (`04:00 IST – 23:00 IST`).
- **Latency SLO**:
  - `p95 < 180ms` and `p99 < 400ms` for read endpoints (`/api/products`, `/api/customers/:id/dashboard`, `/api/analytics/overview`).
  - `p95 < 250ms` for transactional write endpoints (`/api/retailer-orders/:id/instant-bill`, `/api/customers/deliveries/confirm`).
- **Financial Ledger Integrity Target**: `100%` atomic consistency (`0` partial writes or unrecorded balance mutations).

### 3. Database Migration, Backup & Disaster Recovery Runbook
- **Safe Rolling Migrations**:
  - Run `DATABASE_URL=$DIRECT_MIGRATION_DATABASE_URL npx prisma migrate deploy` during deployment before rolling new application containers.
  - Application runtime connects via `amul_app_user` (DML only: `SELECT, INSERT, UPDATE, DELETE`), while schema migrations use `amul_migrator` (DDL permissions).
- **Automated Daily Backups**:
  - Daily logical + binary log backup at `01:30 IST`:
    `mysqldump --single-transaction --routines --triggers amul_distribution | gzip > /backups/amul_$(date +%F).sql.gz`
  - Retain daily snapshots for 30 days and monthly snapshots for 12 months in encrypted off-site object storage.
- **Rollback & Recovery Procedure**:
  - **Application Rollback**: Revert container tag to previous green SHA in `docker-compose.yml` and restart (`docker compose up -d backend admin-web`).
  - **Database Point-in-Time Recovery (PITR)**: Restore latest daily dump into staging verification instance, replay binary logs up to the pre-incident timestamp, verify `SUM(ledger_transactions)` reconciles with `retailer_balances` and `customer_wallets`, and promote.

### 4. Android APK Release Signing & Distribution Guide (Section 5)
- **Production Build**:
  - Run `eas build --platform android --profile production-apk` inside `mobile-app/`.
  - Ensure `EXPO_PUBLIC_DEMO_SWITCHER="false"` is set so the Demo Role Switcher is disabled in production builds.
- **Keystore Custody**:
  - Every future APK update must be signed with the exact same `.jks` keystore so Android allows in-place upgrades without uninstalling or losing local session storage.
- **Phone Installation Steps for DSEs, Retailers & Customers**:
  1. Share the signed `amul-party-release.apk` via WhatsApp, Telegram, or direct download QR code.
  2. Open the APK file on the Android phone and enable **"Install unknown apps"** when prompted.
  3. Tap **Install** (if Google Play Protect shows an unfamiliar app prompt, tap **"Install anyway"**).
  4. Sign in with the 10-digit phone number and password issued by the Admin.
