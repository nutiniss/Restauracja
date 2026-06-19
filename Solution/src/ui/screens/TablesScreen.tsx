import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  MenuItem,
  Order,
  OrderItem,
  RestaurantTable,
  Waiter,
} from '../../domain/entities';
import { PaymentMethod } from '../../domain/entities/PaymentMethod';
import { SectionTitle } from '../components/SectionTitle';
import { StatusBadge } from '../components/StatusBadge';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function TablesScreen({
  tables,
  selectedTable,
  selectedOrder,
  orderItems,
  paymentMethods,
  waiters,
  paymentMethodId,
  selectedItemIds,
  isDetailsOpen,
  getWaiter,
  getMenuItem,
  getOrderTotal,
  getPaidTotal,
  onOpenOrder,
  onTogglePaymentItem,
  onChangePaymentMethod,
  onAssignWaiter,
  onPaySelectedItems,
  onPayFullBill,
  onReleaseTable,
  onCloseDetails,
  onAddOrderItem,
}: {
  tables: RestaurantTable[];
  selectedTable: RestaurantTable;
  selectedOrder?: Order;
  orderItems: OrderItem[];
  paymentMethods: PaymentMethod[];
  waiters: Waiter[];
  paymentMethodId: number;
  selectedItemIds: number[];
  isDetailsOpen: boolean;
  getWaiter: (id?: number) => Waiter | undefined;
  getMenuItem: (id: number) => MenuItem | undefined;
  getOrderTotal: (orderId?: number) => number;
  getPaidTotal: (orderId?: number) => number;
  onOpenOrder: (table: RestaurantTable) => void;
  onTogglePaymentItem: (itemId: number) => void;
  onChangePaymentMethod: (methodId: number) => void;
  onAssignWaiter: (waiterId: number) => void;
  onPaySelectedItems: () => void;
  onPayFullBill: () => void;
  onReleaseTable: () => void;
  onCloseDetails: () => void;
  onAddOrderItem: () => void;
}) {
  const selectedAmount = orderItems
    .filter(item => selectedItemIds.includes(item.id) && !item.isPaid)
    .reduce((sum, item) => sum + item.total, 0);
  const remainingAmount = Math.max(
    getOrderTotal(selectedOrder?.id) - getPaidTotal(selectedOrder?.id),
    0,
  );
  const isBillPaid = Boolean(selectedOrder) && remainingAmount === 0;
  const assignedWaiter = getWaiter(selectedTable.waiterId);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);

  const assignWaiterAndClose = (waiterId: number) => {
    onAssignWaiter(waiterId);
    setIsWaiterModalOpen(false);
  };

  const closeDetails = () => {
    setIsWaiterModalOpen(false);
    onCloseDetails();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Sala i stoliki"
          subtitle="Wybierz stolik, otwórz rachunek albo opłać wybrane pozycje."
        />
        <View style={styles.tableGrid}>
          {tables.map(table => {
            const waiter = getWaiter(table.waiterId);
            const remaining =
              getOrderTotal(table.orderId) - getPaidTotal(table.orderId);

            return (
              <Pressable
                key={table.id}
                style={styles.tableCard}
                onPress={() => onOpenOrder(table)}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.tableNumber}>Stolik {table.number}</Text>
                  <StatusBadge status={table.status} />
                </View>
                <Text style={styles.cardMuted}>
                  {table.zone} • {table.seats} miejsca
                </Text>
                <Text style={styles.cardText}>
                  Kelner: {waiter?.fullName ?? 'nieprzypisany'}
                </Text>
                <Text style={styles.amount}>{money(remaining)} do zapłaty</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={isDetailsOpen}
        transparent={false}
        onRequestClose={closeDetails}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalWindow}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.rowBetween}>
                <View style={styles.flexOne}>
                  <Text style={styles.sectionHeading}>
                    Rachunek stolika {selectedTable.number}
                  </Text>
                  <Text style={styles.cardMuted}>
                    Kelner: {assignedWaiter?.fullName ?? 'brak'}
                  </Text>
                </View>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setIsWaiterModalOpen(true)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {assignedWaiter ? 'Zmień' : 'Dodaj'}
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={12}
                  style={styles.closeButton}
                  onPress={closeDetails}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.rowBetween}>
                <Text style={styles.amount}>
                  {money(remainingAmount)} do zapłaty
                </Text>
                <Pressable
                  style={styles.primaryButton}
                  onPress={onAddOrderItem}
                >
                  <Text style={styles.primaryButtonText}>Dodaj pozycję</Text>
                </Pressable>
              </View>

              {!selectedOrder && (
                <Text style={styles.emptyText}>
                  Ten stolik nie ma jeszcze otwartego zamówienia.
                </Text>
              )}

              {orderItems.map(item => {
                const menuItem = getMenuItem(item.menuItemId);
                const selected = selectedItemIds.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    disabled={item.isPaid}
                    style={[
                      styles.orderRow,
                      selected && styles.orderRowSelected,
                      item.isPaid && styles.orderRowPaid,
                    ]}
                    onPress={() => onTogglePaymentItem(item.id)}
                  >
                    <View style={styles.flexOne}>
                      <Text style={styles.orderName}>
                        {menuItem?.name ?? 'Pozycja'} x{item.quantity}
                      </Text>
                      <Text style={styles.cardMuted}>
                        {item.isPaid
                          ? 'Opłacone'
                          : 'Dotknij, aby zaznaczyć do płatności'}
                      </Text>
                    </View>
                    <Text style={styles.orderAmount}>{money(item.total)}</Text>
                  </Pressable>
                );
              })}

              <View style={styles.summaryBox}>
                <Text style={styles.cardText}>
                  Razem: {money(getOrderTotal(selectedOrder?.id))}
                </Text>
                <Text style={styles.cardText}>
                  Zapłacono: {money(getPaidTotal(selectedOrder?.id))}
                </Text>
                <Text style={styles.summaryAmount}>
                  Pozostało:{' '}
                  {money(
                    getOrderTotal(selectedOrder?.id) -
                      getPaidTotal(selectedOrder?.id),
                  )}
                </Text>
              </View>

              <View style={styles.paymentCard}>
                <Text style={styles.sectionHeading}>Płatność</Text>
                <View style={styles.methodRow}>
                  {paymentMethods.map(method => (
                    <Pressable
                      key={method.id}
                      style={[
                        styles.chip,
                        paymentMethodId === method.id && styles.chipActive,
                      ]}
                      onPress={() => onChangePaymentMethod(method.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          paymentMethodId === method.id &&
                            styles.chipTextActive,
                        ]}
                      >
                        {method.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {isBillPaid && (
                  <Text style={styles.paidMessage}>
                    Rachunek został opłacony.
                  </Text>
                )}
                <View style={styles.paymentActionRow}>
                  <Text style={styles.summaryAmount}>
                    Wybrano: {money(selectedAmount)}
                  </Text>
                  <Pressable
                    disabled={selectedAmount === 0 || isBillPaid}
                    style={[
                      styles.primaryButton,
                      (selectedAmount === 0 || isBillPaid) &&
                        styles.disabledButton,
                    ]}
                    onPress={onPaySelectedItems}
                  >
                    <Text style={styles.primaryButtonText}>Zapłać wybrane</Text>
                  </Pressable>
                </View>
                <View style={styles.paymentActionRow}>
                  <Text style={styles.remainingLabel}>
                    Pozostało do zapłaty: {money(remainingAmount)}
                  </Text>
                  <Pressable
                    disabled={remainingAmount === 0}
                    style={[
                      styles.primaryButton,
                      remainingAmount === 0 && styles.disabledButton,
                    ]}
                    onPress={onPayFullBill}
                  >
                    <Text style={styles.primaryButtonText}>Opłać całość</Text>
                  </Pressable>
                </View>
                {isBillPaid && (
                  <Pressable
                    style={[styles.primaryButton, styles.releaseButton]}
                    onPress={onReleaseTable}
                  >
                    <Text style={styles.primaryButtonText}>Zwolnij stolik</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isWaiterModalOpen}
        onRequestClose={() => setIsWaiterModalOpen(false)}
      >
        <View style={styles.overlayBackdrop}>
          <View style={styles.waiterModalWindow}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.sectionHeading}>Wybierz kelnera</Text>
                <Text style={styles.cardMuted}>
                  Stolik {selectedTable.number} zostanie przypisany do wybranej
                  osoby.
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.closeButton}
                onPress={() => setIsWaiterModalOpen(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.waiterList}>
              {waiters.map(waiter => (
                <Pressable
                  key={waiter.id}
                  disabled={!waiter.isActive}
                  style={[
                    styles.waiterOption,
                    selectedTable.waiterId === waiter.id &&
                      styles.waiterOptionActive,
                    !waiter.isActive && styles.disabledChip,
                  ]}
                  onPress={() => assignWaiterAndClose(waiter.id)}
                >
                  <Text
                    style={[
                      styles.waiterOptionText,
                      selectedTable.waiterId === waiter.id &&
                        styles.waiterOptionTextActive,
                    ]}
                  >
                    {waiter.fullName}
                  </Text>
                  <Text
                    style={[
                      styles.cardMuted,
                      selectedTable.waiterId === waiter.id &&
                        styles.waiterOptionTextActive,
                    ]}
                  >
                    Kod: {waiter.code} •{' '}
                    {waiter.isActive ? 'aktywny' : 'nieaktywny'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    elevation: 2,
    padding: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: '48%',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableNumber: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardText: { color: '#334e68', fontSize: 14, marginTop: 8 },
  amount: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  modalBackdrop: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  modalWindow: {
    backgroundColor: colors.surface,
    elevation: 6,
    flex: 1,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  modalContent: { padding: 16, paddingBottom: 28 },
  paymentCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    marginTop: 16,
    padding: 14,
  },
  sectionHeading: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 15, marginTop: 14 },
  orderRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 12,
  },
  orderRowSelected: {
    backgroundColor: '#d0ebff',
    borderColor: colors.primaryLight,
    borderWidth: 1,
  },
  orderRowPaid: { backgroundColor: '#edf2f7', opacity: 0.65 },
  orderName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  orderAmount: { color: colors.text, fontSize: 15, fontWeight: '800' },
  summaryBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginTop: 14,
    padding: 14,
  },
  summaryAmount: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 14,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  chipText: { color: '#334e68', fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  disabledChip: { opacity: 0.45 },
  primaryButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  secondaryButton: {
    backgroundColor: '#edf2f7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  paymentActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  remainingLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  paidMessage: {
    color: '#0b7285',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  releaseButton: { alignItems: 'center', marginTop: 14 },
  disabledButton: { backgroundColor: '#9fb3c8' },
  overlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  waiterModalWindow: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    width: '100%',
  },
  waiterList: { gap: 10, marginTop: 16 },
  waiterOption: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  waiterOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  waiterOptionText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  waiterOptionTextActive: { color: '#fff' },
  flexOne: { flex: 1 },
});
