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
import { PaymentStatus } from '../../domain/enums/RestaurantEnums';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function HistoryScreen({
  payments,
  orders,
  tables,
  paymentMethods,
  getInvoiceUrl,
}: {
  payments: Payment[];
  orders: Order[];
  tables: RestaurantTable[];
  paymentMethods: PaymentMethod[];
  getInvoiceUrl: (paymentId: number) => string;
}) {
  const completedPayments = payments.filter(
    payment => payment.status === PaymentStatus.Completed,
  );
  const revenue = completedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const tips = completedPayments.reduce(
    (sum, payment) => sum + payment.tipAmount,
    0,
  );
  const averagePayment =
    completedPayments.length > 0 ? revenue / completedPayments.length : 0;

  const openInvoice = (paymentId: number) => {
    Linking.openURL(getInvoiceUrl(paymentId));
  };

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={payments}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={
        <>
          <SectionTitle
            title="Historia płatności"
            subtitle="Płatności całe i za wybrane pozycje rachunku."
          />
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Raport utargu</Text>
            <View style={styles.reportGrid}>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Utarg</Text>
                <Text style={styles.reportValue}>{money(revenue)}</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Płatności</Text>
                <Text style={styles.reportValue}>
                  {completedPayments.length}
                </Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Śr. płatność</Text>
                <Text style={styles.reportValue}>{money(averagePayment)}</Text>
              </View>
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Napiwki</Text>
                <Text style={styles.reportValue}>{money(tips)}</Text>
              </View>
            </View>
          </View>
        </>
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
            <Pressable
              style={styles.invoiceButton}
              onPress={() => openInvoice(item.id)}
            >
              <Text style={styles.invoiceButtonText}>Pobierz fakturę PDF</Text>
            </Pressable>
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
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 14,
    padding: 16,
  },
  reportTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reportItem: {
    backgroundColor: '#f0f4f8',
    borderRadius: 14,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  reportLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reportValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  menuName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  cardMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardText: { color: '#334e68', fontSize: 14, marginTop: 8 },
  invoiceButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 10,
  },
  invoiceButtonText: { color: colors.surface, fontWeight: '900' },
});
