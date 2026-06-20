import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  Order,
  Payment,
  PaymentMethod,
  RestaurantTable,
} from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function HistoryScreen({
  payments,
  orders,
  tables,
  paymentMethods,
}: {
  payments: Payment[];
  orders: Order[];
  tables: RestaurantTable[];
  paymentMethods: PaymentMethod[];
}) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={payments}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={
        <SectionTitle
          title="Historia płatności"
          subtitle="Płatności całe i za wybrane pozycje rachunku."
        />
      }
      renderItem={({ item }) => {
        const order = orders.find(current => current.id === item.orderId);
        const table = tables.find(current => current.id === order?.tableId);
        const method = paymentMethods.find(
          current => current.id === item.paymentMethodId,
        );

        return (
          <View style={styles.listCard}>
            <Text style={styles.menuName}>
              Płatność #{item.id} • {money(item.amount)}
            </Text>
            <Text style={styles.cardMuted}>
              Stolik {table?.number ?? '-'} • {method?.name} • {item.paidAt}
            </Text>
            <Text style={styles.cardText}>
              Napiwek: {money(item.tipAmount)}
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
});
