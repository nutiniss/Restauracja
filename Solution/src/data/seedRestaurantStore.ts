import {MenuCategory, MenuItem, Order, OrderItem, Payment, PaymentMethod, RestaurantTable, Waiter} from '../domain/entities';
import {OrderItemStatus, OrderStatus, TableStatus} from '../domain/enums/RestaurantEnums';
import {RestaurantStore} from '../domain/repositories/RestaurantStore';

export const createSeedRestaurantStore = (): RestaurantStore => ({
  waiters: [
    new Waiter(1, 'Anna', 'Nowak', 'AN01'),
    new Waiter(2, 'Marek', 'Kowalski', 'MK02'),
    new Waiter(3, 'Julia', 'Lis', 'JL03'),
  ],
  categories: [
    new MenuCategory(1, 'Pizza', 'Wypiekana w piecu', 1),
    new MenuCategory(2, 'Napoje', 'Zimne i gorące', 2),
    new MenuCategory(3, 'Desery', 'Słodkie zakończenie', 3),
  ],
  menuItems: [
    new MenuItem(1, 1, 'Margherita', 'Sos pomidorowy, mozzarella, bazylia', 32),
    new MenuItem(2, 1, 'Capricciosa', 'Szynka, pieczarki, mozzarella', 39),
    new MenuItem(3, 1, 'Diavola', 'Pikantne salami, chilli', 42),
    new MenuItem(4, 2, 'Lemoniada', 'Cytryna, mięta, lód', 14),
    new MenuItem(5, 2, 'Espresso', 'Podwójny shot', 10),
    new MenuItem(6, 3, 'Tiramisu', 'Mascarpone, kawa, kakao', 22),
  ],
  paymentMethods: [
    new PaymentMethod(1, 'Karta'),
    new PaymentMethod(2, 'Gotówka'),
    new PaymentMethod(3, 'BLIK'),
  ],
  tables: [
    new RestaurantTable(1, 1, 2, 'Sala'),
    new RestaurantTable(2, 2, 4, 'Sala', TableStatus.Occupied, 1, 1),
    new RestaurantTable(3, 3, 4, 'Ogródek', TableStatus.PartiallyPaid, 2, 2),
    new RestaurantTable(4, 4, 6, 'Sala'),
    new RestaurantTable(5, 5, 2, 'Taras', TableStatus.Paid, 3, 3),
    new RestaurantTable(6, 6, 8, 'Sala'),
  ],
  orders: [
    new Order(1, 2, 1, '12:30', OrderStatus.Open),
    new Order(2, 3, 2, '13:05', OrderStatus.PartiallyPaid),
    new Order(3, 5, 3, '11:40', OrderStatus.Paid, '12:25'),
  ],
  orderItems: [
    new OrderItem(1, 1, 1, 1, 32, OrderItemStatus.Served),
    new OrderItem(2, 1, 4, 2, 14, OrderItemStatus.Served),
    new OrderItem(3, 2, 2, 1, 39, OrderItemStatus.Paid, 1),
    new OrderItem(4, 2, 6, 1, 22, OrderItemStatus.Served),
    new OrderItem(5, 3, 5, 2, 10, OrderItemStatus.Paid, 2),
  ],
  payments: [
    new Payment(1, 2, 1, 39, 0, '13:30'),
    new Payment(2, 3, 2, 20, 5, '12:25'),
  ],
});
