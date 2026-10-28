import {
  PrismaClient,
  Role,
  ProductUnitType,
  SubscriptionStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

async function main() {
  console.log("🌱 Seeding Amul Party Distribution Database...");

  // Clear existing data in correct dependency order
  await prisma.ledgerTransaction.deleteMany();
  await prisma.customerMonthlyBill.deleteMany();
  await prisma.customerDailyDelivery.deleteMany();
  await prisma.customerSkipDay.deleteMany();
  await prisma.customerSubscription.deleteMany();
  await prisma.retailerOrderItem.deleteMany();
  await prisma.retailerOrder.deleteMany();
  await prisma.retailerBalance.deleteMany();
  await prisma.customerWallet.deleteMany();
  await prisma.dseStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 1. Products Palette with 4-side image fields & inclusive GST
  const productsData = [
    {
      skuCode: "AMUL-GOLD-500",
      name: "Amul Gold 500ml",
      category: "Milk",
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 24,
      retailerPrice: 31.5,
      customerPrice: 33.0,
      gstPercentage: 0.0,
      godownStockQty: 1200,
      imageFrontUrl: "/uploads/products/amul-gold-front.jpg",
    },
    {
      skuCode: "AMUL-TAAZA-500",
      name: "Amul Taaza 500ml",
      category: "Milk",
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 24,
      retailerPrice: 26.5,
      customerPrice: 28.0,
      gstPercentage: 0.0,
      godownStockQty: 1500,
      imageFrontUrl: "/uploads/products/amul-taaza-front.jpg",
    },
    {
      skuCode: "AMUL-BUTTER-500",
      name: "Amul Butter 500g",
      category: "Butter",
      unitType: ProductUnitType.Box,
      unitsPerCrate: 20,
      retailerPrice: 250.0,
      customerPrice: 285.0,
      gstPercentage: 12.0,
      godownStockQty: 400,
      imageFrontUrl: "/uploads/products/amul-butter-front.jpg",
    },
    {
      skuCode: "AMUL-DAHI-400",
      name: "Amul Masti Dahi 400g",
      category: "Curd",
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 30,
      retailerPrice: 32.0,
      customerPrice: 35.0,
      gstPercentage: 5.0,
      godownStockQty: 600,
      imageFrontUrl: "/uploads/products/amul-dahi-front.jpg",
    },
    {
      skuCode: "AMUL-PANEER-200",
      name: "Amul Malai Paneer 200g",
      category: "Paneer",
      unitType: ProductUnitType.Pouch,
      unitsPerCrate: 40,
      retailerPrice: 88.0,
      customerPrice: 95.0,
      gstPercentage: 5.0,
      godownStockQty: 350,
      imageFrontUrl: "/uploads/products/amul-paneer-front.jpg",
    },
    {
      skuCode: "AMUL-COOL-200",
      name: "Amul Cool Cafe 200ml",
      category: "Beverage",
      unitType: ProductUnitType.Box,
      unitsPerCrate: 30,
      retailerPrice: 22.0,
      customerPrice: 25.0,
      gstPercentage: 12.0,
      godownStockQty: 500,
      imageFrontUrl: "/uploads/products/amul-cool-front.jpg",
    },
  ];

  const productsMap = new Map<string, string>();
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    productsMap.set(p.skuCode, created.id);
  }

  // 2. Users (Admin, DSEs, Retailers, Customers)
  const passwordHash = hashPassword("Amul@2026!");

  const admin = await prisma.user.create({
    data: {
      role: Role.ADMIN,
      name: "Amul Party Admin",
      shopName: "Howrah Central Amul Hub",
      phone: "9999999990",
      email: "admin@amulparty.com",
      passwordHash,
      address: "GT Road, Howrah 711101",
    },
  });

  const dse1 = await prisma.user.create({
    data: {
      role: Role.DSE,
      name: "Rahul DSE",
      phone: "9999999991",
      email: "rahul.dse@amulparty.com",
      passwordHash,
      address: "Shibpur & Dobson Road Beat",
    },
  });

  const dse2 = await prisma.user.create({
    data: {
      role: Role.DSE,
      name: "Vikram DSE",
      phone: "9999999992",
      email: "vikram.dse@amulparty.com",
      passwordHash,
      address: "Liluah & Belur Beat",
    },
  });

  // Direct Retailer (No DSE assigned)
  const directRetailer = await prisma.user.create({
    data: {
      role: Role.RETAILER,
      name: "Suresh Agarwal",
      shopName: "Shree Ganesh Dairy Parlour",
      phone: "9999999993",
      passwordHash,
      address: "14 Netaji Subhas Road, Howrah",
    },
  });
  await prisma.retailerBalance.create({
    data: { retailerId: directRetailer.id, currentDue: "500.00" },
  });

  // DSE 1 Retailers
  const retailer1 = await prisma.user.create({
    data: {
      role: Role.RETAILER,
      name: "Mahesh Gupta",
      shopName: "Mahalaxmi General Store",
      phone: "9999999995",
      assignedDseId: dse1.id,
      passwordHash,
      address: "42 Dobson Road, Howrah",
    },
  });
  await prisma.retailerBalance.create({
    data: { retailerId: retailer1.id, currentDue: "500.00" },
  });

  const retailer2 = await prisma.user.create({
    data: {
      role: Role.RETAILER,
      name: "Bimal Sen",
      shopName: "Annapurna Bakery & Dairy",
      phone: "9999999996",
      assignedDseId: dse1.id,
      passwordHash,
      address: "88 Kadamtala Bazaar, Howrah",
    },
  });
  await prisma.retailerBalance.create({
    data: { retailerId: retailer2.id, currentDue: "1850.00" },
  });

  // DSE 2 Retailer
  const retailer3 = await prisma.user.create({
    data: {
      role: Role.RETAILER,
      name: "Subir Chatterjee",
      shopName: "Belur Fresh Mart",
      phone: "9999999998",
      assignedDseId: dse2.id,
      passwordHash,
      address: "12 Grand Trunk Rd, Belur",
    },
  });
  await prisma.retailerBalance.create({
    data: { retailerId: retailer3.id, currentDue: "920.00" },
  });

  // DSE 1 Customer
  const customer1 = await prisma.user.create({
    data: {
      role: Role.CUSTOMER,
      name: "Priya Sharma",
      phone: "9999999994",
      assignedDseId: dse1.id,
      passwordHash,
      address: "Flat 4B, Ganga Residency, Shibpur",
    },
  });
  await prisma.customerWallet.create({
    data: { customerId: customer1.id, walletBalance: "300.00" },
  });

  const sub1Existing = await prisma.customerSubscription.findFirst({
    where: {
      customerId: customer1.id,
      productId: productsMap.get("AMUL-TAAZA-500")!,
    },
  });
  if (sub1Existing) {
    await prisma.customerSubscription.update({
      where: { id: sub1Existing.id },
      data: { dailyQty: 2, status: SubscriptionStatus.ACTIVE },
    });
  } else {
    await prisma.customerSubscription.create({
      data: {
        customerId: customer1.id,
        productId: productsMap.get("AMUL-TAAZA-500")!,
        dailyQty: 2,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  // DSE 2 Customer (Low wallet balance < 150 alert)
  const customer2 = await prisma.user.create({
    data: {
      role: Role.CUSTOMER,
      name: "Rajeshwar Chatterjee",
      phone: "9999999997",
      assignedDseId: dse2.id,
      passwordHash,
      address: "19 Belur Station Road, Howrah",
    },
  });
  await prisma.customerWallet.create({
    data: { customerId: customer2.id, walletBalance: "84.00" },
  });

  const sub2Existing = await prisma.customerSubscription.findFirst({
    where: {
      customerId: customer2.id,
      productId: productsMap.get("AMUL-GOLD-500")!,
    },
  });
  if (sub2Existing) {
    await prisma.customerSubscription.update({
      where: { id: sub2Existing.id },
      data: { dailyQty: 2, status: SubscriptionStatus.ACTIVE },
    });
  } else {
    await prisma.customerSubscription.create({
      data: {
        customerId: customer2.id,
        productId: productsMap.get("AMUL-GOLD-500")!,
        dailyQty: 2,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  // 3. Allocate Initial DSE Vehicle Stock
  await prisma.dseStock.create({
    data: {
      dseId: dse1.id,
      productId: productsMap.get("AMUL-GOLD-500")!,
      liveQty: 120,
    },
  });
  await prisma.dseStock.create({
    data: {
      dseId: dse1.id,
      productId: productsMap.get("AMUL-TAAZA-500")!,
      liveQty: 150,
    },
  });
  await prisma.dseStock.create({
    data: {
      dseId: dse2.id,
      productId: productsMap.get("AMUL-PANEER-200")!,
      liveQty: 80,
    },
  });

  console.log(
    "✅ Database seeded successfully with Amul product palette, DSE staff, retailers, customers, and stock!",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
