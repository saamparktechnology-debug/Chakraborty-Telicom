/**
 * Exact Decimal Arithmetic in Paise (1 INR = 100 Paise).
 * Prevents floating-point rounding drift across invoices, split payments, and wallets.
 */
export class Money {
  static toPaise(amount: string | number): bigint {
    const str = typeof amount === 'number' ? amount.toFixed(2) : String(amount).trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
      throw new Error(`Invalid monetary format: ${amount}`);
    }
    const isNegative = str.startsWith('-');
    const clean = isNegative ? str.slice(1) : str;
    const [rupees, frac = ''] = clean.split('.');
    const paddedFrac = (frac + '00').slice(0, 2);
    const total = BigInt(rupees) * 100n + BigInt(paddedFrac);
    return isNegative ? -total : total;
  }

  static toDecimalString(paise: bigint): string {
    const isNegative = paise < 0n;
    const abs = isNegative ? -paise : paise;
    const rupees = abs / 100n;
    const cents = (abs % 100n).toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${rupees.toString()}.${cents}`;
  }

  static multiplyQty(unitPrice: string | number, qty: number): bigint {
    if (!Number.isInteger(qty) || qty < 0) {
      throw new Error(`Quantity must be a non-negative integer, received: ${qty}`);
    }
    return Money.toPaise(unitPrice) * BigInt(qty);
  }
}
