import { createSeedRestaurantStore } from '../data/seedRestaurantStore';
import {
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  RestaurantTable,
  Waiter,
} from '../domain/entities';
import { RestaurantStore } from '../domain/repositories/RestaurantStore';

const API_URL = 'http://10.0.2.2:5000/api/restaurant';
const API_ORIGIN = 'http://10.0.2.2:5000';

const toStore = (data: RestaurantStore): RestaurantStore => ({
  tables: data.tables.map(
    table =>
      new RestaurantTable(
        table.id,
        table.number,
        table.seats,
        table.zone,
        table.status,
        table.waiterId,
        table.orderId,
        table.isActive,
      ),
  ),
  waiters: data.waiters.map(
    waiter =>
      new Waiter(
        waiter.id,
        waiter.firstName,
        waiter.lastName,
        waiter.code,
        waiter.isActive,
      ),
  ),
  categories: data.categories.map(
    category =>
      new MenuCategory(
        category.id,
        category.name,
        category.description,
        category.displayOrder,
        category.isActive,
      ),
  ),
  menuItems: data.menuItems.map(
    item =>
      new MenuItem(
        item.id,
        item.categoryId,
        item.name,
        item.description,
        item.price,
        item.isAvailable,
        item.imageUrl,
      ),
  ),
  orders: data.orders.map(
    order =>
      new Order(
        order.id,
        order.tableId,
        order.waiterId,
        order.openedAt,
        order.status,
        order.closedAt,
        order.notes,
      ),
  ),
  orderItems: data.orderItems.map(
    item =>
      new OrderItem(
        item.id,
        item.orderId,
        item.menuItemId,
        item.quantity,
        item.unitPrice,
        item.status,
        item.paymentId,
        item.notes,
      ),
  ),
  payments: data.payments.map(
    payment =>
      new Payment(
        payment.id,
        payment.orderId,
        payment.paymentMethodId,
        payment.amount,
        payment.tipAmount,
        payment.paidAt,
        payment.status,
      ),
  ),
  paymentMethods: data.paymentMethods.map(
    method => new PaymentMethod(method.id, method.name, method.isActive),
  ),
});

async function request(
  path: string,
  init?: RequestInit,
): Promise<RestaurantStore> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return toStore(await response.json());
}

export const restaurantApi = {
  seedStore: createSeedRestaurantStore,
  getStore: () => request('/store'),
  openOrder: (tableId: number) =>
    request(`/tables/${tableId}/orders/open`, { method: 'POST' }),
  addItem: (
    tableId: number,
    menuItemId: number,
    quantity: number,
    notes?: string,
  ) =>
    request(`/tables/${tableId}/items`, {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity, notes }),
    }),
  assignWaiter: (tableId: number, waiterId: number) =>
    request(`/tables/${tableId}/waiter`, {
      method: 'PUT',
      body: JSON.stringify({ waiterId }),
    }),
  payOrder: (
    orderId: number,
    paymentMethodId: number,
    orderItemIds?: number[],
    tipAmount = 0,
  ) =>
    request(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId, orderItemIds, tipAmount }),
    }),
  releaseTable: (tableId: number) =>
    request(`/tables/${tableId}/release`, { method: 'POST' }),
  getInvoiceUrl: (paymentId: number) =>
    `${API_ORIGIN}/api/restaurant/payments/${paymentId}/invoice`,
};
