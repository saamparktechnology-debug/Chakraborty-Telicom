import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export class UsersController {
  async onboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.onboardUser(req.user!, req.body);
      res.status(201).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }

  async listDses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dses = await usersService.listDses();
      res.status(200).json({ success: true, dses });
    } catch (error) {
      next(error);
    }
  }

  async listRetailers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const directOnly = req.query.directOnly === 'true';
      const retailers = await usersService.listRetailers(req.user!, directOnly);
      res.status(200).json({ success: true, retailers });
    } catch (error) {
      next(error);
    }
  }

  async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await usersService.listCustomers(req.user!);
      res.status(200).json({ success: true, customers });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
