import { Request, Response, NextFunction } from "express";
import { stockService } from "./stock.service";

export class StockController {
  async getOverview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await stockService.getStockOverview(req.user!);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  async addInward(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updated = await stockService.addAmulInwardStock(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, updated });
    } catch (error) {
      next(error);
    }
  }

  async allocateToDse(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const allocated = await stockService.allocateStockToDse(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, allocated });
    } catch (error) {
      next(error);
    }
  }

  async returnFromDse(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const returned = await stockService.returnStockFromDse(
        req.user!,
        req.body,
      );
      res.status(200).json({ success: true, returned });
    } catch (error) {
      next(error);
    }
  }
}

export const stockController = new StockController();
