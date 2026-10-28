import { PrismaClient, Role, ProductUnitType, SubscriptionStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPasswordDemo(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  console.log('Seeding Amul Party Distribution & Subscription Management Platform...');

  const defaultPassHash = hashPasswordDemo('Amul@2026!');

  // 1. Admin Account (9999999990)
  const admin = await prisma.user.upsert({
    where: { phone: '9999999990' },
    update: {},
    create: {
      role: Role.ADMIN,
      name: 'Amul Party Admin',
      shopName: 'Howrah Central Amul Distribution Hub',
      phone: '9999999990',
      email: 'admin@amulparty.in',
      passwordHash: defaultPassHash,
      address: 'GT Road, Howrah, West Bengal 711101',
      isActive: true,
    },
  });

  // 2. DSE 1 (9999999991 — Rahul DSE) & DSE 2 (9999999992 — Vikram DSE)
  const rahulDse = await prisma.user.upsert({
    where: { phone: '9999999991' },
    update: {},
    create: {
      role: Role.DSE,
      name: 'Rahul DSE',
      phone: '9999999991',
      passwordHash: defaultPassHash,
      createdById: admin.id,
      address: 'Shibpur Beat, Howrah',
    },
  });

  const vikramDse = await prisma.user.upsert({
    where: { phone: '9999999992' },
    update: {},
    create: {
      role: Role.DSE,
      name: 'Vikram DSE',
      phone: '9999999992',
      passwordHash: defaultPassHash,
      createdById: admin.id,
      address: 'Liluah & Belur Beat, Howrah',
    },
  });

  // 3. Seed 6 Products (Section 15)
  const productsData = [
    {
      skuCode: 'AMUL-GOLD-500',
      name: 'Amul Gold 500ml',
      category: 'Milk',
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 24,
      retailerPrice: '31.50',
      customerPrice: '33.00',
    },
    {
      skuCode: 'AMUL-TAAZA-500',
      name: 'Amul Taaza 500ml',
      category: 'Milk',
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 24,
      retailerPrice: '26.50',
      customerPrice: '28.00',
    },
    {
      skuCode: 'AMUL-BUTTER-500',
      name: 'Amul Butter 500g',
      category: 'Butter',
      unitType: ProductUnitType.Box,
      unitsPerCrate: 20,
      retailerPrice: '275.00',
      customerPrice: '285.00',
    },
    {
      skuCode: 'AMUL-DAHI-400',
      name: 'Amul Masti Dahi 400g',
      category: 'Curd',
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 30,
      retailerPrice: '32.00',
      customerPrice: '35.00',
    },
    {
      skuCode: 'AMUL-PANEER-200',
      name: 'Amul Malai Paneer 200g',
      category: 'Paneer',
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 40,
      retailerPrice: '88.00',
      customerPrice: '95.00',
    },
    {
      skuCode: 'AMUL-COOL-200',
      name: 'Amul Cool Cafe 200ml',
      category: 'Beverage',
      unitType: ProductUnitType.Box,
      unitsPerCrate: 30,
      retailerPrice: '22.00',
      customerPrice: '25.00',
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    products[p.skuCode] = await prisma.product.upsert({
      where: { skuCode: p.skuCode },
      update: {},
      create: p,
    });
  }

  // 4. Retailers (1 Direct Retailer 9999999993 + 2 Assigned to Rahul DSE)
  const directRetailer = await prisma.user.upsert({
    where: { phone: '9999999993' },
    update: {},
    create: {
      role: Role.RETAILER,
      name: 'Suresh Agarwal',
      shopName: 'Shree Ganesh Dairy Parlour',
      phone: '9999999993',
      passwordHash: defaultPassHash,
      assignedDseId: null, // Direct Retailer without DSE
      createdById: admin.id,
      address: '14 Netaji Subhas Road, Howrah',
    },
  });
  await prisma.retailerBalance.upsert({
    where: { retailerId: directRetailer.id },
    update: {},
    create: { retailerId: directRetailer.id, currentDue: '500.00' },
  });

  const retailer2 = await prisma.user.upsert({
    where: { phone: '9999999995' },
    update: {},
    create: {
      role: Role.RETAILER,
      name: 'Mahesh Gupta',
      shopName: 'Mahalaxmi General Store',
      phone: '9999999995',
      passwordHash: defaultPassHash,
      assignedDseId: rahulDse.id,
      createdById: rahulDse.id,
      address: '42 Dobson Road, Howrah',
    },
  });
  await prisma.retailerBalance.upsert({
    where: { retailerId: retailer2.id },
    update: {},
    create: { retailerId: retailer2.id, currentDue: '500.00' },
  });

  const retailer3 = await prisma.user.upsert({
    where: { phone: '9999999996' },
    update: {},
    create: {
      role: Role.RETAILER,
      name: 'Bimal Sen',
      shopName: 'Annapurna Bakery & Dairy',
      phone: '9999999996',
      passwordHash: defaultPassHash,
      assignedDseId: rahulDse.id,
      createdById: rahulDse.id,
      address: '88 Kadamtala Bazaar, Howrah',
    },
  });
  await prisma.retailerBalance.upsert({
    where: { retailerId: retailer3.id },
    update: {},
    create: { retailerId: retailer3.id, currentDue: '1850.00' },
  });

  // 5. Customers (9999999994 with ₹300.00 wallet topped up by Admin + 9999999997)
  const customer1 = await prisma.user.upsert({
    where: { phone: '9999999994' },
    update: {},
    create: {
      role: Role.CUSTOMER,
      name: 'Priya Sharma',
      phone: '9999999994',
      passwordHash: defaultPassHash,
      assignedDseId: rahulDse.id,
      createdById: rahulDse.id,
      address: 'Flat 4B, Ganga Residency, Shibpur, Howrah',
    },
  });
  await prisma.customerWallet.upsert({
    where: { customerId: customer1.id },
    update: {},
    create: { customerId: customer1.id, walletBalance: '300.00' },
  });
  await prisma.customerSubscription.upsert({
    where: { customerId_productId: { customerId: customer1.id, productId: products['AMUL-TAAZA-500'].id } },
    update: {},
    create: {
      customerId: customer1.id,
      productId: products['AMUL-TAAZA-500'].id,
      dailyQty: 2,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { phone: '9999999997' },
    update: {},
    create: {
      role: Role.CUSTOMER,
      name: 'Rajeshwar Chatterjee',
      phone: '9999999997',
      passwordHash: defaultPassHash,
      assignedDseId: vikramDse.id,
      createdById: admin.id,
      address: '19 Belur Station Road, Howrah',
    },
  });
  await prisma.customerWallet.upsert({
    where: { customerId: customer2.id },
    update: {},
    create: { customerId: customer2.id, walletBalance: '84.00' },
  });
  await prisma.customerSubscription.upsert({
    where: { customerId_productId: { customerId: customer2.id, productId: products['AMUL-GOLD-500'].id } },
    update: {},
    create: {
      customerId: customer2.id,
      productId: products['AMUL-GOLD-500'].id,
      dailyQty: 2,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
