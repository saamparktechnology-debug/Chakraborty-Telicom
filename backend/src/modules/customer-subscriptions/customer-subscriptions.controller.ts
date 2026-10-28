import { Request, Response, NextFunction } from "express";
import { customerSubscriptionsService } from "./customer-subscriptions.service";

export class CustomerSubscriptionsController {
  async walletTopup(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await customerSubscriptionsService.topUpWallet(
        req.params.id,
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dashboard = await customerSubscriptionsService.getCustomerDashboard(
        req.params.id,
      );
      res.status(200).json({ success: true, ...dashboard });
    } catch (error) {
      next(error);
    }
  }

  async toggleSkipDay(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await customerSubscriptionsService.toggleSkipDay(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async confirmDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await customerSubscriptionsService.confirmDailyDelivery(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async sendBill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const bill = await customerSubscriptionsService.sendPeriodicBill(
        req.params.id,
        req.user!,
        req.body,
      );
      res.status(201).json({ success: true, bill });
    } catch (error) {
      next(error);
    }
  }
}

export const customerSubscriptionsController =
  new CustomerSubscriptionsController();
