import React from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Order,
  Payment,
  PaymentMethod,
  RestaurantTable,
} from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

const downloadInvoice = (payment: Payment) => {
  if (!payment.invoiceUrl) {
    return;
  }

  Linking.openURL(payment.invoiceUrl);
};

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
            {item.hasInvoice ? (
              <View style={styles.invoiceRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.invoiceLabel}>Faktura</Text>
                  <Text style={styles.cardMuted}>{item.invoiceNumber}</Text>
                </View>
                <Pressable
                  style={styles.invoiceButton}
                  onPress={() => downloadInvoice(item)}
                >
                  <Text style={styles.invoiceButtonText}>Pobierz</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.cardMuted}>
                Brak faktury dla tej płatności
              </Text>
            )}
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
  flexOne: { flex: 1 },
  invoiceRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 12,
  },
  invoiceLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  invoiceButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  invoiceButtonText: { color: '#fff', fontWeight: '900' },
});
