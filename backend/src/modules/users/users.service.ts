import { Role, LedgerEntryType, OrderStatus, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { Money } from '../../config/money';
import { AppError } from '../../middlewares/error.middleware';
import { AuthService } from '../auth/auth.service';
import { OnboardUserInput } from './users.validation';
import { AuthenticatedUser } from '../../middlewares/auth.middleware';

export class UsersService {
  async onboardUser(actor: AuthenticatedUser, input: OnboardUserInput) {
    if (input.role === Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot create another ADMIN via onboarding endpoint.');
    }
    if (input.role === Role.DSE && actor.role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN_ROLE', 'Only ADMIN can create a DSE account.');
    }

    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing) {
      throw new AppError(409, 'DUPLICATE_PHONE', `Phone number ${input.phone} is already registered.`);
    }

    const assignedDseId =
      actor.role === Role.DSE
        ? actor.id
        : input.assignedDseId || null;

    const passwordHash = AuthService.hashPassword(input.password);

    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          role: input.role,
          name: input.name,
          shopName: input.shopName || null,
          phone: input.phone,
          passwordHash,
          assignedDseId,
          createdById: actor.id,
          address: input.address || null,
          isActive: true,
        },
      });

      if (input.role === Role.RETAILER) {
        await tx.retailerBalance.create({
          data: {
            retailerId: created.id,
            currentDue: '0.00',
          },
        });
      }

      if (input.role === Role.CUSTOMER) {
        await tx.customerWallet.create({
          data: {
            customerId: created.id,
            walletBalance: '0.00',
          },
        });

        if (input.initialSubscription) {
          await tx.customerSubscription.create({
            data: {
              customerId: created.id,
              productId: input.initialSubscription.productId,
              dailyQty: input.initialSubscription.dailyQty,
              status: SubscriptionStatus.ACTIVE,
            },
          });
        }
      }

      return {
        id: created.id,
        role: created.role,
        name: created.name,
        shopName: created.shopName,
        phone: created.phone,
        assignedDseId: created.assignedDseId,
        address: created.address,
      };
    });
  }

  async listDses() {
    const dses = await prisma.user.findMany({
      where: { role: Role.DSE, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return await Promise.all(
      dses.map(async (dse) => {
        const [assignedRetailers, assignedCustomers, pendingDeliveries, ledgerEntries] = await Promise.all([
          prisma.user.count({ where: { role: Role.RETAILER, assignedDseId: dse.id } }),
          prisma.user.count({ where: { role: Role.CUSTOMER, assignedDseId: dse.id } }),
          prisma.retailerOrder.count({ where: { dseId: dse.id, status: OrderStatus.INDENTED } }),
          prisma.ledgerTransaction.findMany({
            where: { recordedById: dse.id, createdAt: { gte: todayStart } },
          }),
        ]);

        let cashPaise = 0n;
        let upiPaise = 0n;
        let billedPaise = 0n;
        for (const entry of ledgerEntries) {
          if (entry.entryType === LedgerEntryType.PAYMENT_CASH_CREDIT) {
            cashPaise += Money.toPaise(entry.amount.toString());
          } else if (entry.entryType === LedgerEntryType.PAYMENT_UPI_CREDIT) {
            upiPaise += Money.toPaise(entry.amount.toString());
          } else if (entry.entryType === LedgerEntryType.INVOICE_DEBIT) {
            billedPaise += Money.toPaise(entry.amount.toString());
          }
        }

        return {
          id: dse.id,
          name: dse.name,
          phone: dse.phone,
          address: dse.address,
          assignedRetailers,
          assignedCustomers,
          pendingDeliveries,
          todayCashCollected: Money.toDecimalString(cashPaise),
          todayUpiCollected: Money.toDecimalString(upiPaise),
          todayTotalBilled: Money.toDecimalString(billedPaise),
        };
      })
    );
  }

  async listRetailers(actor: AuthenticatedUser, directOnly?: boolean) {
    const whereClause: Record<string, unknown> = { role: Role.RETAILER, isActive: true };
    if (directOnly) {
      whereClause.assignedDseId = null;
    } else if (actor.role === Role.DSE) {
      whereClause.assignedDseId = actor.id;
    }

    const retailers = await prisma.user.findMany({
      where: whereClause,
      include: {
        retailerBalance: true,
        assignedDse: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return retailers.map((r) => ({
      id: r.id,
      name: r.name,
      shopName: r.shopName,
      phone: r.phone,
      address: r.address,
      assignedDseId: r.assignedDseId,
      assignedDse: r.assignedDse,
      currentDue: r.retailerBalance ? r.retailerBalance.currentDue.toString() : '0.00',
    }));
  }

  async listCustomers(actor: AuthenticatedUser) {
    const whereClause: Record<string, unknown> = { role: Role.CUSTOMER, isActive: true };
    if (actor.role === Role.DSE) {
      whereClause.assignedDseId = actor.id;
    }

    const customers = await prisma.user.findMany({
      where: whereClause,
      include: {
        customerWallet: true,
        subscriptions: { include: { product: true } },
        skipDays: true,
        assignedDse: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      assignedDseId: c.assignedDseId,
      assignedDse: c.assignedDse,
      walletBalance: c.customerWallet ? c.customerWallet.walletBalance.toString() : '0.00',
      subscriptions: c.subscriptions,
      skipDays: c.skipDays,
    }));
  }
}

export const usersService = new UsersService();
