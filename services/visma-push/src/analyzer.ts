import type { Order } from "./fetchOrders.js";
import { config } from "./config.js";

export interface CustomerPattern {
  customerId: string;
  customerName: string;
  avgIntervalDays: number;
  lastOrderDate: Date;
  daysSinceLastOrder: number;
  topProduct: { id: string; description: string; orderCount: number };
  isOverdue: boolean;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86_400_000);
}

export function analyzeCustomers(orders: Order[]): CustomerPattern[] {
  // Group orders by customer
  const byCustomer = new Map<string, Order[]>();
  for (const order of orders) {
    const list = byCustomer.get(order.customerId) ?? [];
    list.push(order);
    byCustomer.set(order.customerId, list);
  }

  const today = new Date();
  const patterns: CustomerPattern[] = [];

  for (const [customerId, customerOrders] of byCustomer) {
    // Need at least 2 orders to compute an interval
    if (customerOrders.length < 2) continue;

    // Sort descending
    const sorted = [...customerOrders].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Average interval between consecutive orders
    let totalIntervalDays = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      totalIntervalDays += daysBetween(sorted[i].date, sorted[i + 1].date);
    }
    const avgIntervalDays = totalIntervalDays / (sorted.length - 1);

    // Only consider customers with a meaningful regular cadence (at least every 90 days)
    if (avgIntervalDays > 90) continue;

    const lastOrderDate = sorted[0].date;
    const daysSinceLastOrder = daysBetween(today, lastOrderDate);

    // Find their most-ordered product
    const productCounts = new Map<string, { id: string; description: string; count: number }>();
    for (const order of customerOrders) {
      for (const line of order.lines) {
        const existing = productCounts.get(line.inventoryId);
        if (existing) {
          existing.count++;
        } else {
          productCounts.set(line.inventoryId, {
            id: line.inventoryId,
            description: line.description,
            count: 1,
          });
        }
      }
    }

    const topProduct = [...productCounts.values()].sort((a, b) => b.count - a.count)[0];
    if (!topProduct) continue;

    const threshold = avgIntervalDays * (1 + config.overdueThresholdPct / 100);
    const isOverdue = daysSinceLastOrder > threshold;

    patterns.push({
      customerId,
      customerName: sorted[0].customerName,
      avgIntervalDays: Math.round(avgIntervalDays),
      lastOrderDate,
      daysSinceLastOrder,
      topProduct: {
        id: topProduct.id,
        description: topProduct.description,
        orderCount: topProduct.count,
      },
      isOverdue,
    });
  }

  return patterns;
}
