import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amul Party — Distribution & Subscription Management Portal",
  description:
    "B2B Supply Chain, Split-Payment Billing, Khata Ledger & B2C Prepaid Milk Subscription",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased"
      >
        {children}
      </body>
    </html>
  );
}
