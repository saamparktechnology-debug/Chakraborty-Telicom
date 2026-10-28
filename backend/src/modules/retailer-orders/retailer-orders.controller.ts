import { Request, Response, NextFunction } from "express";
import { OrderStatus } from "@prisma/client";
import { retailerOrdersService } from "./retailer-orders.service";

export class RetailerOrdersController {
  async listOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const orders = await retailerOrdersService.listOrders(req.user!, status);
      res.status(200).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }

  async createIndent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await retailerOrdersService.createIndent(
        req.user!,
        req.body,
      );
      res.status(201).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  async instantBill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await retailerOrdersService.convertIndentToInstantBill(
        req.params.id,
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  async spotBill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await retailerOrdersService.createSpotBill(
        req.user!,
        req.body,
      );
      res.status(201).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  async collectDue(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await retailerOrdersService.collectStandaloneDue(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getRetailerPassbook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data =
        await retailerOrdersService.getRetailerOrderHistoryAndPassbook(
          req.params.retailerId,
        );
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }
}

export const retailerOrdersController = new RetailerOrdersController();
