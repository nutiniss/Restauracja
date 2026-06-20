import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  Order,
  OrderItem,
  Payment,
  RestaurantTable,
  Waiter,
} from '../../domain/entities';
import { TableStatus } from '../../domain/enums/RestaurantEnums';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function WaitersScreen({
  waiters,
  tables,
  orders,
  orderItems,
  payments,
}: {
  waiters: Waiter[];
  tables: RestaurantTable[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
}) {
  const totalRevenue = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={waiters}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={
        <>
          <SectionTitle
            title="Raport kelnerów"
            subtitle="Aktywne stoliki, liczba zamówień oraz sprzedaż przypisana do kelnerów."
          />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{money(totalRevenue)}</Text>
            <Text style={styles.cardMuted}>
              Łączna sprzedaż w historii płatności
            </Text>
          </View>
        </>
      }
      renderItem={({ item }) => {
        const waiterOrders = orders.filter(order => order.waiterId === item.id);
        const waiterOrderIds = waiterOrders.map(order => order.id);
        const waiterPayments = payments.filter(payment =>
          waiterOrderIds.includes(payment.orderId),
        );
        const revenue = waiterPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );
        const tips = waiterPayments.reduce(
          (sum, payment) => sum + payment.tipAmount,
          0,
        );
        const activeTables = tables.filter(
          table =>
            table.waiterId === item.id && table.status !== TableStatus.Free,
        ).length;
        const orderedItems = orderItems
          .filter(orderItem => waiterOrderIds.includes(orderItem.orderId))
          .reduce((sum, orderItem) => sum + orderItem.quantity, 0);

        return (
          <View style={styles.listCard}>
            <Text style={styles.menuName}>{item.fullName}</Text>
            <Text style={styles.cardMuted}>
              Kod: {item.code} • aktywny: {item.isActive ? 'tak' : 'nie'}
            </Text>
            <Text style={styles.cardText}>
              Aktualne stoliki: {activeTables}
            </Text>
            <Text style={styles.cardText}>
              Zamówienia: {waiterOrders.length} • pozycje: {orderedItems}
            </Text>
            <Text style={styles.reportText}>
              Sprzedaż: {money(revenue)} • napiwki: {money(tips)}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 10,
    padding: 14,
  },
  menuName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  cardMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardText: { color: '#334e68', fontSize: 14, marginTop: 8 },
  reportText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
  },
  summaryValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
});
