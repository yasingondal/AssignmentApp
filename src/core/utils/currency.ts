export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  if (discountPercent <= 0) {
    return price;
  }
  return Math.round(price * (1 - discountPercent / 100));
}

export interface CartLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export function calculateCartTotals(items: CartLineItem[]): CartTotals {
  let subtotal = 0;
  let discount = 0;
  let itemCount = 0;

  for (const item of items) {
    const lineSubtotal = item.unitPrice * item.quantity;
    const lineTotal = calculateDiscountedPrice(item.unitPrice, item.discountPercent) * item.quantity;
    subtotal += lineSubtotal;
    discount += lineSubtotal - lineTotal;
    itemCount += item.quantity;
  }

  return {
    subtotal,
    discount,
    total: subtotal - discount,
    itemCount,
  };
}
