import { fetchAllPages } from "./vismaClient.js";
import { config } from "./config.js";

export interface OrderLine {
  inventoryId: string;
  description: string;
  quantity: number;
  extendedPrice: number;
}

export interface Order {
  id: string;
  date: Date;
  customerId: string;
  customerName: string;
  orderTotal: number;
  lines: OrderLine[];
}

export interface CustomerContact {
  customerId: string;
  customerName: string;
  email: string | null;
  contactName: string | null;
}

// Skip purely administrative/placeholder line items
const SKIP_INVENTORY_IDS = new Set(["x", "FRAKT", "SERV", "Open 1"]);

function isRealLine(line: OrderLine): boolean {
  return !SKIP_INVENTORY_IDS.has(line.inventoryId) && line.extendedPrice > 0;
}

export async function fetchRecentOrders(): Promise<Order[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - config.lookbackMonths);
  const sinceIso = since.toISOString().split("T")[0];

  type PageData = {
    salesOrder: {
      items: Array<{
        id: string;
        date: string;
        customer: { id: string; name: string };
        status: { cancelled: boolean | null };
        totals: { orderTotal: number };
        orderLines: Array<{
          inventory: { id: string; description: string };
          description: string;
          quantity: number;
          extendedPrice: number;
        }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };

  const orders = await fetchAllPages<Order>(
    (cursor) => `{
      salesOrder(
        first: 200
        ${cursor ? `after: "${cursor}"` : ""}
        where: {
          date: { gte: "${sinceIso}" }
          status_cancelled: { ne: true }
        }
        orderBy: [{ date: DESC }]
      ) {
        pageInfo { hasNextPage endCursor }
        items {
          id
          date
          customer { id name }
          status { cancelled }
          totals { orderTotal }
          orderLines {
            inventory { id description }
            description
            quantity
            extendedPrice
          }
        }
      }
    }`,
    (raw) => {
      const data = raw as PageData;
      const items = data.salesOrder.items.map((o) => ({
        id: o.id,
        date: new Date(o.date),
        customerId: o.customer.id,
        customerName: o.customer.name,
        orderTotal: o.totals.orderTotal,
        lines: o.orderLines
          .map((l) => ({
            inventoryId: l.inventory.id,
            description: l.description || l.inventory.description,
            quantity: l.quantity,
            extendedPrice: l.extendedPrice,
          }))
          .filter(isRealLine),
      }));
      return { items, pageInfo: data.salesOrder.pageInfo };
    }
  );

  // Keep only orders that have at least one real product line
  return orders.filter((o) => o.lines.length > 0);
}

export async function fetchCustomerEmails(customerIds: string[]): Promise<Map<string, CustomerContact>> {
  if (customerIds.length === 0) return new Map();

  // Get email via the most recent invoice per customer
  const idList = customerIds.map((id) => `"${id}"`).join(", ");

  type InvoiceData = {
    customerInvoice: {
      items: Array<{
        customerId: string;
        invoiceContact: { email: string | null; businessName: string | null };
        customer: { id: string; name: string };
      }>;
    };
  };

  const result = await fetchAllPages<CustomerContact>(
    (cursor) => `{
      customerInvoice(
        first: 200
        ${cursor ? `after: "${cursor}"` : ""}
        where: { customerId: { in: [${idList}] } }
        groupBy: [{ customerId: ASC }]
        orderBy: [{ documentDate: DESC }]
      ) {
        pageInfo { hasNextPage endCursor }
        items {
          customerId
          invoiceContact { email businessName }
          customer { id name }
        }
      }
    }`,
    (raw) => {
      const data = raw as InvoiceData;
      const items = data.customerInvoice.items.map((inv) => ({
        customerId: inv.customerId,
        customerName: inv.customer.name,
        email: inv.invoiceContact?.email ?? null,
        contactName: inv.invoiceContact?.businessName ?? null,
      }));
      // deduplicate by customerId - keep first (most recent)
      const seen = new Set<string>();
      const unique = items.filter((c) => {
        if (seen.has(c.customerId)) return false;
        seen.add(c.customerId);
        return true;
      });
      return {
        items: unique,
        pageInfo: { hasNextPage: false, endCursor: null },
      };
    }
  );

  const map = new Map<string, CustomerContact>();
  for (const c of result) map.set(c.customerId, c);
  return map;
}
