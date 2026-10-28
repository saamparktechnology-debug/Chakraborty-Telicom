import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { AppError } from "./error.middleware";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  phone: string;
  name: string;
  shopName?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bearerHeader = req.headers.authorization;
    const token = bearerHeader?.startsWith("Bearer ")
      ? bearerHeader.slice(7).trim()
      : null;

    if (!token) {
      next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "Authentication required. Please log in.",
        ),
      );
      return;
    }

    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
    ) as AuthenticatedUser;
    if (!decoded?.id) {
      next(
        new AppError(401, "UNAUTHORIZED", "Malformed authentication token."),
      );
      return;
    }

    // Verify user against live MySQL database and enforce authoritative DB role
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        phone: true,
        name: true,
        shopName: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "User account is inactive or no longer exists.",
        ),
      );
      return;
    }

    req.user = {
      id: dbUser.id,
      role: dbUser.role,
      phone: dbUser.phone,
      name: dbUser.name,
      shopName: dbUser.shopName,
    };
    next();
  } catch {
    next(
      new AppError(
        401,
        "SESSION_EXPIRED",
        "Invalid or expired authentication token. Please log in again.",
      ),
    );
  }
}

export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "Authentication required. Please log in.",
        ),
      );
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "FORBIDDEN_ROLE",
          `Access denied: role '${req.user.role}' is not permitted to perform this operation. Allowed roles: ${allowedRoles.join(", ")}.`,
        ),
      );
      return;
    }
    next();
  };
}

export function enforceSelfOrStaff(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "Authentication required. Please log in.",
        ),
      );
      return;
    }
    const targetId = req.params[paramName];
    if (
      (user.role === Role.RETAILER || user.role === Role.CUSTOMER) &&
      user.id !== targetId
    ) {
      next(
        new AppError(
          403,
          "FORBIDDEN_OWNERSHIP",
          "Access denied: you can only view your own account records.",
        ),
      );
      return;
    }
    next();
  };
}
