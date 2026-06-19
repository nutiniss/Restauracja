import {MenuCategory, MenuItem, Order, OrderItem, Payment, PaymentMethod, RestaurantTable, Waiter} from '../entities';

export type RestaurantStore = {
  tables: RestaurantTable[];
  waiters: Waiter[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
};
