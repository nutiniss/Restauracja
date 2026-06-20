import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  RestaurantTable,
  Waiter,
} from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function HistoryScreen({
  payments,
  orders,
  tables,
  paymentMethods,
  orderItems,
  waiters,
}: {
  payments: Payment[];
  orders: Order[];
  tables: RestaurantTable[];
  paymentMethods: PaymentMethod[];
  orderItems: OrderItem[];
  waiters: Waiter[];
}) {
  const report = useMemo(() => {
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const totalTips = payments.reduce(
      (sum, payment) => sum + payment.tipAmount,
      0,
    );
    const paidOrders = orders.filter(order =>
      payments.some(payment => payment.orderId === order.id),
    ).length;
    const averagePayment = payments.length ? totalPaid / payments.length : 0;

    return { totalPaid, totalTips, paidOrders, averagePayment };
  }, [orders, payments]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={orders}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={
        <>
          <SectionTitle
            title="Raport zamówień i płatności"
            subtitle="Podsumowanie sprzedaży, napiwków oraz historia rachunków z datami płatności."
          />
          <View style={styles.reportGrid}>
            <ReportTile label="Sprzedaż" value={money(report.totalPaid)} />
            <ReportTile label="Napiwki" value={money(report.totalTips)} />
            <ReportTile
              label="Opłacone rachunki"
              value={String(report.paidOrders)}
            />
            <ReportTile
              label="Średnia płatność"
              value={money(report.averagePayment)}
            />
          </View>
          <Text style={styles.sectionHeading}>Zamówienia</Text>
        </>
      }
      renderItem={({ item }) => {
        const table = tables.find(current => current.id === item.tableId);
        const waiter = waiters.find(current => current.id === item.waiterId);
        const orderPayments = payments.filter(
          payment => payment.orderId === item.id,
        );
        const total = orderItems
          .filter(orderItem => orderItem.orderId === item.id)
          .reduce((sum, orderItem) => sum + orderItem.total, 0);
        const paid = orderPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );

        return (
          <View style={styles.listCard}>
            <Text style={styles.menuName}>
              Zamówienie #{item.id} • stolik {table?.number ?? '-'}
            </Text>
            <Text style={styles.cardMuted}>
              Otwarte: {item.openedAt} • zamknięte: {item.closedAt ?? 'w toku'}
            </Text>
            <Text style={styles.cardText}>
              Kelner: {waiter?.fullName ?? '-'}
            </Text>
            <Text style={styles.cardText}>
              Wartość: {money(total)} • zapłacono: {money(paid)} • pozostało:{' '}
              {money(Math.max(total - paid, 0))}
            </Text>
            {orderPayments.map(payment => {
              const method = paymentMethods.find(
                current => current.id === payment.paymentMethodId,
              );

              return (
                <Text key={payment.id} style={styles.paymentLine}>
                  Płatność #{payment.id}: {money(payment.amount)} •{' '}
                  {method?.name}
                  {' • '}data: {payment.paidAt} • napiwek:{' '}
                  {money(payment.tipAmount)}
                </Text>
              );
            })}
          </View>
        );
      }}
    />
  );
}

function ReportTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reportTile}>
      <Text style={styles.reportValue}>{value}</Text>
      <Text style={styles.reportLabel}>{label}</Text>
    </View>
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
  paymentLine: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  reportTile: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 14,
  },
  reportValue: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  reportLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
});
