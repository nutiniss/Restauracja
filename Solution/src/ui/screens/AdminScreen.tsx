import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  MenuCategory,
  MenuItem,
  PaymentMethod,
  RestaurantTable,
  Waiter,
} from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const numberOr = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const priceOr = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nextId = (items: { id: number }[]) =>
  Math.max(...items.map(item => item.id), 0) + 1;

export function AdminScreen({
  tables,
  categories,
  menuItems,
  paymentMethods,
  waiters,
  onAddTable,
  onAddCategory,
  onAddMenuItem,
  onAddPaymentMethod,
  onAddWaiter,
}: {
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  waiters: Waiter[];
  onAddTable: (table: RestaurantTable) => void;
  onAddCategory: (category: MenuCategory) => void;
  onAddMenuItem: (item: MenuItem) => void;
  onAddPaymentMethod: (method: PaymentMethod) => void;
  onAddWaiter: (waiter: Waiter) => void;
}) {
  const [tableNumber, setTableNumber] = useState('');
  const [tableSeats, setTableSeats] = useState('4');
  const [tableZone, setTableZone] = useState('Sala');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState(categories[0]?.id);
  const [paymentMethodName, setPaymentMethodName] = useState('');
  const [waiterFirstName, setWaiterFirstName] = useState('');
  const [waiterLastName, setWaiterLastName] = useState('');
  const [waiterCode, setWaiterCode] = useState('');

  const stats = useMemo(
    () => [
      ['Stoliki', tables.length],
      ['Pozycje menu', menuItems.length],
      ['Kategorie', categories.length],
      ['Płatności', paymentMethods.length],
      ['Kelnerzy', waiters.length],
    ],
    [
      categories.length,
      menuItems.length,
      paymentMethods.length,
      tables.length,
      waiters.length,
    ],
  );

  const addTable = () => {
    const number = numberOr(
      tableNumber,
      Math.max(...tables.map(table => table.number), 0) + 1,
    );
    onAddTable(
      new RestaurantTable(
        nextId(tables),
        number,
        numberOr(tableSeats, 4),
        tableZone.trim() || 'Sala',
      ),
    );
    setTableNumber('');
  };

  const addCategory = () => {
    if (!categoryName.trim()) {
      return;
    }
    onAddCategory(
      new MenuCategory(
        nextId(categories),
        categoryName.trim(),
        categoryDescription.trim() || 'Bez opisu',
        Math.max(...categories.map(category => category.displayOrder), 0) + 1,
      ),
    );
    setCategoryName('');
    setCategoryDescription('');
  };

  const addMenuItem = () => {
    if (!itemName.trim() || !itemCategoryId) {
      return;
    }
    onAddMenuItem(
      new MenuItem(
        nextId(menuItems),
        itemCategoryId,
        itemName.trim(),
        itemDescription.trim() || 'Bez opisu',
        priceOr(itemPrice, 0),
      ),
    );
    setItemName('');
    setItemDescription('');
    setItemPrice('');
  };

  const addPaymentMethod = () => {
    if (!paymentMethodName.trim()) {
      return;
    }
    onAddPaymentMethod(
      new PaymentMethod(nextId(paymentMethods), paymentMethodName.trim()),
    );
    setPaymentMethodName('');
  };

  const addWaiter = () => {
    if (!waiterFirstName.trim() || !waiterLastName.trim()) {
      return;
    }
    onAddWaiter(
      new Waiter(
        nextId(waiters),
        waiterFirstName.trim(),
        waiterLastName.trim(),
        waiterCode.trim() ||
          `${waiterFirstName[0] ?? 'K'}${nextId(waiters)}`.toUpperCase(),
      ),
    );
    setWaiterFirstName('');
    setWaiterLastName('');
    setWaiterCode('');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionTitle
        title="Administracja"
        subtitle="Zarządzaj słownikami restauracji. W tym trybie nie otwiera się nowych zamówień."
      />
      <View style={styles.statsRow}>
        {stats.map(([label, value]) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <AdminCard
        title="Nowy stolik"
        onSubmit={addTable}
        submitLabel="Dodaj stolik"
      >
        <TextInput
          style={styles.input}
          placeholder="Numer stolika"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={tableNumber}
          onChangeText={setTableNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Liczba miejsc"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={tableSeats}
          onChangeText={setTableSeats}
        />
        <TextInput
          style={styles.input}
          placeholder="Strefa"
          placeholderTextColor={colors.muted}
          value={tableZone}
          onChangeText={setTableZone}
        />
      </AdminCard>

      <AdminCard
        title="Nowa kategoria menu"
        onSubmit={addCategory}
        submitLabel="Dodaj kategorię"
      >
        <TextInput
          style={styles.input}
          placeholder="Nazwa kategorii"
          placeholderTextColor={colors.muted}
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <TextInput
          style={styles.input}
          placeholder="Opis"
          placeholderTextColor={colors.muted}
          value={categoryDescription}
          onChangeText={setCategoryDescription}
        />
      </AdminCard>

      <AdminCard
        title="Nowa pozycja w menu"
        onSubmit={addMenuItem}
        submitLabel="Dodaj pozycję"
      >
        <View style={styles.chipRow}>
          {categories.map(category => (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                itemCategoryId === category.id && styles.chipActive,
              ]}
              onPress={() => setItemCategoryId(category.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  itemCategoryId === category.id && styles.chipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Nazwa pozycji"
          placeholderTextColor={colors.muted}
          value={itemName}
          onChangeText={setItemName}
        />
        <TextInput
          style={styles.input}
          placeholder="Opis"
          placeholderTextColor={colors.muted}
          value={itemDescription}
          onChangeText={setItemDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Cena"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={itemPrice}
          onChangeText={setItemPrice}
        />
      </AdminCard>

      <AdminCard
        title="Nowa metoda płatności"
        onSubmit={addPaymentMethod}
        submitLabel="Dodaj metodę"
      >
        <TextInput
          style={styles.input}
          placeholder="Nazwa metody"
          placeholderTextColor={colors.muted}
          value={paymentMethodName}
          onChangeText={setPaymentMethodName}
        />
      </AdminCard>

      <AdminCard
        title="Nowy kelner"
        onSubmit={addWaiter}
        submitLabel="Dodaj kelnera"
      >
        <TextInput
          style={styles.input}
          placeholder="Imię"
          placeholderTextColor={colors.muted}
          value={waiterFirstName}
          onChangeText={setWaiterFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nazwisko"
          placeholderTextColor={colors.muted}
          value={waiterLastName}
          onChangeText={setWaiterLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Kod (opcjonalnie)"
          placeholderTextColor={colors.muted}
          value={waiterCode}
          onChangeText={setWaiterCode}
        />
      </AdminCard>
    </ScrollView>
  );
}

function AdminCard({
  title,
  children,
  submitLabel,
  onSubmit,
}: {
  title: string;
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
      <Pressable style={styles.primaryButton} onPress={onSubmit}>
        <Text style={styles.primaryButtonText}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    minWidth: '31%',
    padding: 12,
  },
  statValue: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: 10,
    marginBottom: 12,
    padding: 14,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    padding: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  chipText: { color: '#334e68', fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
});
