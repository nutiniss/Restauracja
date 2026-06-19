import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MenuCategory, MenuItem, RestaurantTable } from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function MenuScreen({
  categories,
  menuItems,
  tables,
  selectedCategoryId,
  search,
  sourceTableId,
  onSelectCategory,
  onChangeSearch,
  onAddItem,
  onBackToOrder,
}: {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  selectedCategoryId: number;
  search: string;
  sourceTableId?: number;
  onSelectCategory: (categoryId: number) => void;
  onChangeSearch: (value: string) => void;
  onAddItem: (
    item: MenuItem,
    tableId: number,
    quantity: number,
    notes?: string,
  ) => void;
  onBackToOrder?: () => void;
}) {
  const [itemToAdd, setItemToAdd] = useState<MenuItem>();
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<number | undefined>(
    sourceTableId ?? tables[0]?.id,
  );

  const filteredItems = menuItems.filter(
    item =>
      item.categoryId === selectedCategoryId &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const isTableReadonly = Boolean(sourceTableId);
  const modalTableId = sourceTableId ?? selectedTableId;
  const modalTable = tables.find(table => table.id === modalTableId);
  const parsedQuantity = Number.parseInt(quantity, 10);
  const canAdd = Boolean(itemToAdd && modalTableId && parsedQuantity > 0);

  const openAddModal = (item: MenuItem) => {
    setItemToAdd(item);
    setQuantity('1');
    setNotes('');
    setSelectedTableId(sourceTableId ?? selectedTableId ?? tables[0]?.id);
  };

  const closeAddModal = () => {
    setItemToAdd(undefined);
  };

  const confirmAdd = () => {
    if (!itemToAdd || !modalTableId || !canAdd) {
      return;
    }

    onAddItem(
      itemToAdd,
      modalTableId,
      parsedQuantity,
      notes.trim() || undefined,
    );
    closeAddModal();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Menu"
          subtitle="Kategorie i pozycje menu. Dodawanie tworzy osobną pozycję rachunku."
        />
        {sourceTableId && onBackToOrder && (
          <Pressable style={styles.backButton} onPress={onBackToOrder}>
            <Text style={styles.backButtonText}>Wróć do zamówienia</Text>
          </Pressable>
        )}
        <TextInput
          style={styles.input}
          placeholder="Szukaj pozycji menu"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={onChangeSearch}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroller}
        >
          {categories.map(category => (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                selectedCategoryId === category.id && styles.chipActive,
              ]}
              onPress={() => onSelectCategory(category.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategoryId === category.id && styles.chipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {filteredItems.map(item => (
          <View key={item.id} style={styles.menuCard}>
            <View style={styles.flexOne}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.cardMuted}>{item.description}</Text>
              <Text style={styles.amount}>{money(item.price)}</Text>
            </View>
            <Pressable
              disabled={!item.isAvailable}
              style={[
                styles.primaryButton,
                !item.isAvailable && styles.disabledButton,
              ]}
              onPress={() => openAddModal(item)}
            >
              <Text style={styles.primaryButtonText}>Dodaj</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(itemToAdd)}
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalWindow}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.modalTitle}>Dodaj pozycję</Text>
                <Text style={styles.cardMuted}>{itemToAdd?.name}</Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.closeButton}
                onPress={closeAddModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Stolik</Text>
            {isTableReadonly ? (
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>
                  Stolik {modalTable?.number}
                </Text>
              </View>
            ) : (
              <View style={styles.tablePicker}>
                {tables.map(table => (
                  <Pressable
                    key={table.id}
                    style={[
                      styles.tableChip,
                      selectedTableId === table.id && styles.tableChipActive,
                    ]}
                    onPress={() => setSelectedTableId(table.id)}
                  >
                    <Text
                      style={[
                        styles.tableChipText,
                        selectedTableId === table.id &&
                          styles.tableChipTextActive,
                      ]}
                    >
                      {table.number}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.label}>Ilość</Text>
            <TextInput
              keyboardType="number-pad"
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
            />
            <Text style={styles.label}>Notatka</Text>
            <TextInput
              multiline
              style={[styles.input, styles.notesInput]}
              placeholder="Np. bez cebuli, sos osobno"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
            />
            <Pressable
              disabled={!canAdd}
              style={[styles.primaryButton, !canAdd && styles.disabledButton]}
              onPress={confirmAdd}
            >
              <Text style={styles.primaryButtonText}>Dodaj do zamówienia</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    marginBottom: 12,
    padding: 14,
  },
  categoryScroller: { marginBottom: 12 },
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
  menuCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
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
  amount: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  disabledButton: { backgroundColor: '#9fb3c8' },
  flexOne: { flex: 1 },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: { color: '#fff', fontWeight: '800' },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalWindow: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    width: '100%',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 14,
  },
  readonlyField: {
    backgroundColor: '#edf2f7',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  readonlyText: { color: colors.text, fontWeight: '800' },
  tablePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tableChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tableChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  tableChipText: { color: colors.text, fontWeight: '800' },
  tableChipTextActive: { color: '#fff' },
  notesInput: { height: 92, textAlignVertical: 'top' },
});
