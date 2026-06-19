import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import { TableStatus } from '../../domain/enums/RestaurantEnums';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

export type AdminSection =
  | 'tables'
  | 'items'
  | 'categories'
  | 'payments'
  | 'waiters';

type AdminDraft = Record<string, string>;

const emptyDrafts: Record<AdminSection, AdminDraft> = {
  tables: { number: '', seats: '4', zone: 'Sala' },
  items: { name: '', description: '', price: '', categoryId: '' },
  categories: { name: '', description: '' },
  payments: { name: '' },
  waiters: { firstName: '', lastName: '', code: '' },
};

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
  onSaveTable,
  onSaveCategory,
  onSaveMenuItem,
  onSavePaymentMethod,
  onSaveWaiter,
  onDeactivateTable,
  onDeactivateCategory,
  onDeactivateMenuItem,
  onDeactivatePaymentMethod,
  onDeactivateWaiter,
  onActivateTable,
  onActivateCategory,
  onActivateMenuItem,
  onActivatePaymentMethod,
  onActivateWaiter,
}: {
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  waiters: Waiter[];
  onSaveTable: (table: RestaurantTable) => void;
  onSaveCategory: (category: MenuCategory) => void;
  onSaveMenuItem: (item: MenuItem) => void;
  onSavePaymentMethod: (method: PaymentMethod) => void;
  onSaveWaiter: (waiter: Waiter) => void;
  onDeactivateTable: (tableId: number) => void;
  onDeactivateCategory: (categoryId: number) => void;
  onDeactivateMenuItem: (itemId: number) => void;
  onDeactivatePaymentMethod: (methodId: number) => void;
  onDeactivateWaiter: (waiterId: number) => void;
  onActivateTable: (tableId: number) => void;
  onActivateCategory: (categoryId: number) => void;
  onActivateMenuItem: (itemId: number) => void;
  onActivatePaymentMethod: (methodId: number) => void;
  onActivateWaiter: (waiterId: number) => void;
}) {
  const [section, setSection] = useState<AdminSection>();
  const [editingId, setEditingId] = useState<number>();
  const [drafts, setDrafts] = useState(emptyDrafts);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const stats = useMemo(
    () => [
      { id: 'tables' as const, label: 'Stoliki', value: tables.length },
      { id: 'items' as const, label: 'Pozycje menu', value: menuItems.length },
      {
        id: 'categories' as const,
        label: 'Kategorie',
        value: categories.length,
      },
      {
        id: 'payments' as const,
        label: 'Płatności',
        value: paymentMethods.length,
      },
      { id: 'waiters' as const, label: 'Kelnerzy', value: waiters.length },
    ],
    [
      categories.length,
      menuItems.length,
      paymentMethods.length,
      tables.length,
      waiters.length,
    ],
  );

  const draft = section ? drafts[section] : undefined;
  const updateDraft = (name: string, value: string) => {
    if (!section) {
      return;
    }
    setDrafts(current => ({
      ...current,
      [section]: { ...current[section], [name]: value },
    }));
  };

  const openSection = (nextSection: AdminSection) => {
    setSection(nextSection);
    setEditingId(undefined);
    setDrafts(current => ({
      ...current,
      [nextSection]: {
        ...emptyDrafts[nextSection],
        ...(nextSection === 'items'
          ? { categoryId: String(categories[0]?.id ?? '') }
          : {}),
      },
    }));
  };

  const startEdit = (nextDraft: AdminDraft, id: number) => {
    if (!section) {
      return;
    }
    setEditingId(id);
    setDrafts(current => ({ ...current, [section]: nextDraft }));
    setIsFormModalOpen(true);
  };

  const startAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const resetForm = () => {
    if (!section) {
      return;
    }
    setEditingId(undefined);
    setDrafts(current => ({
      ...current,
      [section]: {
        ...emptyDrafts[section],
        ...(section === 'items'
          ? { categoryId: String(categories[0]?.id ?? '') }
          : {}),
      },
    }));
  };

  const save = () => {
    if (!section || !draft) {
      return;
    }

    if (section === 'tables') {
      const current = tables.find(table => table.id === editingId);
      onSaveTable(
        new RestaurantTable(
          editingId ?? nextId(tables),
          numberOr(
            draft.number,
            current?.number ??
              Math.max(...tables.map(table => table.number), 0) + 1,
          ),
          numberOr(draft.seats, current?.seats ?? 4),
          draft.zone.trim() || current?.zone || 'Sala',
          current?.status ?? TableStatus.Free,
          current?.waiterId,
          current?.orderId,
          current?.isActive ?? true,
        ),
      );
    }

    if (section === 'categories' && draft.name.trim()) {
      const current = categories.find(category => category.id === editingId);
      onSaveCategory(
        new MenuCategory(
          editingId ?? nextId(categories),
          draft.name.trim(),
          draft.description.trim() || current?.description || 'Bez opisu',
          current?.displayOrder ??
            Math.max(...categories.map(category => category.displayOrder), 0) +
              1,
          current?.isActive ?? true,
        ),
      );
    }

    if (section === 'items' && draft.name.trim()) {
      const current = menuItems.find(item => item.id === editingId);
      onSaveMenuItem(
        new MenuItem(
          editingId ?? nextId(menuItems),
          numberOr(
            draft.categoryId,
            current?.categoryId ?? categories[0]?.id ?? 0,
          ),
          draft.name.trim(),
          draft.description.trim() || current?.description || 'Bez opisu',
          priceOr(draft.price, current?.price ?? 0),
          current?.isAvailable ?? true,
          current?.imageUrl,
        ),
      );
    }

    if (section === 'payments' && draft.name.trim()) {
      const current = paymentMethods.find(method => method.id === editingId);
      onSavePaymentMethod(
        new PaymentMethod(
          editingId ?? nextId(paymentMethods),
          draft.name.trim(),
          current?.isActive ?? true,
        ),
      );
    }

    if (
      section === 'waiters' &&
      draft.firstName.trim() &&
      draft.lastName.trim()
    ) {
      const current = waiters.find(waiter => waiter.id === editingId);
      const id = editingId ?? nextId(waiters);
      onSaveWaiter(
        new Waiter(
          id,
          draft.firstName.trim(),
          draft.lastName.trim(),
          draft.code.trim() ||
            current?.code ||
            `${draft.firstName[0] ?? 'K'}${id}`.toUpperCase(),
          current?.isActive ?? true,
        ),
      );
    }

    resetForm();
    setIsFormModalOpen(false);
  };

  if (!section) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Administracja"
          subtitle="Zarządzaj słownikami restauracji. W tym trybie nie otwiera się nowych zamówień."
        />
        <View style={styles.statsRow}>
          {stats.map(tile => (
            <Pressable
              key={tile.id}
              style={styles.statCard}
              onPress={() => openSection(tile.id)}
            >
              <Text style={styles.statValue}>{tile.value}</Text>
              <Text style={styles.statLabel}>{tile.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerActions}>
        <Pressable
          style={styles.backButton}
          onPress={() => setSection(undefined)}
        >
          <Text style={styles.backButtonText}>Wróć</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={startAdd}>
          <Text style={styles.primaryButtonText}>Dodaj</Text>
        </Pressable>
      </View>
      <SectionTitle
        title={sectionTitle(section)}
        subtitle="Lista rekordów z możliwością dodawania, edycji i dezaktywacji."
      />
      {renderList({
        section,
        tables,
        categories,
        menuItems,
        paymentMethods,
        waiters,
        startEdit,
        onDeactivateTable,
        onDeactivateCategory,
        onDeactivateMenuItem,
        onDeactivatePaymentMethod,
        onDeactivateWaiter,
        onActivateTable,
        onActivateCategory,
        onActivateMenuItem,
        onActivatePaymentMethod,
        onActivateWaiter,
      })}
      <Modal
        animationType="fade"
        transparent
        visible={isFormModalOpen}
        onRequestClose={() => setIsFormModalOpen(false)}
      >
        <View style={styles.overlayBackdrop}>
          <View style={styles.modalWindow}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>
                {editingId ? 'Edytuj rekord' : 'Dodaj rekord'}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsFormModalOpen(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            {renderForm({
              section,
              draft: draft ?? {},
              categories,
              updateDraft,
            })}
            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Wyczyść</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={save}>
                <Text style={styles.primaryButtonText}>
                  {editingId ? 'Zapisz zmiany' : 'Dodaj'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function sectionTitle(section: AdminSection) {
  return {
    tables: 'Stoliki',
    items: 'Pozycje menu',
    categories: 'Kategorie menu',
    payments: 'Metody płatności',
    waiters: 'Kelnerzy',
  }[section];
}

function renderList({
  section,
  tables,
  categories,
  menuItems,
  paymentMethods,
  waiters,
  startEdit,
  onDeactivateTable,
  onDeactivateCategory,
  onDeactivateMenuItem,
  onDeactivatePaymentMethod,
  onDeactivateWaiter,
  onActivateTable,
  onActivateCategory,
  onActivateMenuItem,
  onActivatePaymentMethod,
  onActivateWaiter,
}: {
  section: AdminSection;
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  waiters: Waiter[];
  startEdit: (draft: AdminDraft, id: number) => void;
  onDeactivateTable: (id: number) => void;
  onDeactivateCategory: (id: number) => void;
  onDeactivateMenuItem: (id: number) => void;
  onDeactivatePaymentMethod: (id: number) => void;
  onDeactivateWaiter: (id: number) => void;
  onActivateTable: (id: number) => void;
  onActivateCategory: (id: number) => void;
  onActivateMenuItem: (id: number) => void;
  onActivatePaymentMethod: (id: number) => void;
  onActivateWaiter: (id: number) => void;
}) {
  const rows = {
    tables: tables.map((table: RestaurantTable) => ({
      id: table.id,
      title: `Stolik ${table.number}`,
      subtitle: `${table.zone} • ${table.seats} miejsc • ${
        table.isActive ? 'aktywny' : 'nieaktywny'
      }`,
      inactive: !table.isActive,
      draft: {
        number: String(table.number),
        seats: String(table.seats),
        zone: table.zone,
      },
      deactivate: () => onDeactivateTable(table.id),
      activate: () => onActivateTable(table.id),
    })),
    items: menuItems.map((item: MenuItem) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.description} • ${item.price.toFixed(2)} zł • ${
        item.isAvailable ? 'aktywna' : 'nieaktywna'
      }`,
      inactive: !item.isAvailable,
      draft: {
        name: item.name,
        description: item.description,
        price: String(item.price),
        categoryId: String(item.categoryId),
      },
      deactivate: () => onDeactivateMenuItem(item.id),
      activate: () => onActivateMenuItem(item.id),
    })),
    categories: categories.map((category: MenuCategory) => ({
      id: category.id,
      title: category.name,
      subtitle: `${category.description} • ${
        category.isActive ? 'aktywna' : 'nieaktywna'
      }`,
      inactive: !category.isActive,
      draft: { name: category.name, description: category.description },
      deactivate: () => onDeactivateCategory(category.id),
      activate: () => onActivateCategory(category.id),
    })),
    payments: paymentMethods.map((method: PaymentMethod) => ({
      id: method.id,
      title: method.name,
      subtitle: method.isActive ? 'aktywna' : 'nieaktywna',
      inactive: !method.isActive,
      draft: { name: method.name },
      deactivate: () => onDeactivatePaymentMethod(method.id),
      activate: () => onActivatePaymentMethod(method.id),
    })),
    waiters: waiters.map((waiter: Waiter) => ({
      id: waiter.id,
      title: waiter.fullName,
      subtitle: `Kod: ${waiter.code} • ${
        waiter.isActive ? 'aktywny' : 'nieaktywny'
      }`,
      inactive: !waiter.isActive,
      draft: {
        firstName: waiter.firstName,
        lastName: waiter.lastName,
        code: waiter.code,
      },
      deactivate: () => onDeactivateWaiter(waiter.id),
      activate: () => onActivateWaiter(waiter.id),
    })),
  }[section];

  return rows.map(row => (
    <View
      key={row.id}
      style={[styles.rowCard, row.inactive && styles.inactiveRow]}
    >
      <View style={styles.flexOne}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
      </View>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => startEdit(row.draft, row.id)}
      >
        <Text style={styles.secondaryButtonText}>Edytuj</Text>
      </Pressable>
      <Pressable
        style={row.inactive ? styles.primaryButton : styles.dangerButton}
        onPress={row.inactive ? row.activate : row.deactivate}
      >
        <Text style={styles.primaryButtonText}>
          {row.inactive ? 'Aktywuj' : 'Dezaktywuj'}
        </Text>
      </Pressable>
    </View>
  ));
}

function renderForm({
  section,
  draft,
  categories,
  updateDraft,
}: {
  section: AdminSection;
  draft: AdminDraft;
  categories: MenuCategory[];
  updateDraft: (name: string, value: string) => void;
}) {
  if (section === 'tables') {
    return (
      <>
        <AdminInput
          placeholder="Numer stolika"
          value={draft.number}
          onChangeText={value => updateDraft('number', value)}
          keyboardType="number-pad"
        />
        <AdminInput
          placeholder="Liczba miejsc"
          value={draft.seats}
          onChangeText={value => updateDraft('seats', value)}
          keyboardType="number-pad"
        />
        <AdminInput
          placeholder="Strefa"
          value={draft.zone}
          onChangeText={value => updateDraft('zone', value)}
        />
      </>
    );
  }
  if (section === 'items') {
    return (
      <>
        <View style={styles.chipRow}>
          {categories.map(category => (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                draft.categoryId === String(category.id) && styles.chipActive,
              ]}
              onPress={() => updateDraft('categoryId', String(category.id))}
            >
              <Text
                style={[
                  styles.chipText,
                  draft.categoryId === String(category.id) &&
                    styles.chipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <AdminInput
          placeholder="Nazwa pozycji"
          value={draft.name}
          onChangeText={value => updateDraft('name', value)}
        />
        <AdminInput
          placeholder="Opis"
          value={draft.description}
          onChangeText={value => updateDraft('description', value)}
        />
        <AdminInput
          placeholder="Cena"
          value={draft.price}
          onChangeText={value => updateDraft('price', value)}
          keyboardType="decimal-pad"
        />
      </>
    );
  }
  if (section === 'categories') {
    return (
      <>
        <AdminInput
          placeholder="Nazwa kategorii"
          value={draft.name}
          onChangeText={value => updateDraft('name', value)}
        />
        <AdminInput
          placeholder="Opis"
          value={draft.description}
          onChangeText={value => updateDraft('description', value)}
        />
      </>
    );
  }
  if (section === 'payments') {
    return (
      <AdminInput
        placeholder="Nazwa metody"
        value={draft.name}
        onChangeText={value => updateDraft('name', value)}
      />
    );
  }
  return (
    <>
      <AdminInput
        placeholder="Imię"
        value={draft.firstName}
        onChangeText={value => updateDraft('firstName', value)}
      />
      <AdminInput
        placeholder="Nazwisko"
        value={draft.lastName}
        onChangeText={value => updateDraft('lastName', value)}
      />
      <AdminInput
        placeholder="Kod"
        value={draft.code}
        onChangeText={value => updateDraft('code', value)}
      />
    </>
  );
}

function AdminInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={styles.input}
      placeholderTextColor={colors.muted}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: { color: '#fff', fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: 10,
    marginTop: 12,
    padding: 14,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  rowCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    padding: 12,
  },
  inactiveRow: { opacity: 0.55 },
  flexOne: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    padding: 14,
  },
  actionRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  overlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalWindow: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    gap: 10,
    padding: 18,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#c92a2a',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  disabledButton: { backgroundColor: '#9fb3c8' },
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
});
