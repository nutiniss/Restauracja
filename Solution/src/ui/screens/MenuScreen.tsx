import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {MenuCategory, MenuItem} from '../../domain/entities';
import {SectionTitle} from '../components/SectionTitle';
import {colors} from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

export function MenuScreen({
  categories,
  menuItems,
  selectedCategoryId,
  search,
  onSelectCategory,
  onChangeSearch,
  onAddItem,
}: {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  selectedCategoryId: number;
  search: string;
  onSelectCategory: (categoryId: number) => void;
  onChangeSearch: (value: string) => void;
  onAddItem: (item: MenuItem) => void;
}) {
  const filteredItems = menuItems.filter(
    item =>
      item.categoryId === selectedCategoryId &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionTitle title="Menu" subtitle="Kategorie i pozycje menu. Dodawanie tworzy osobną pozycję rachunku." />
      <TextInput
        style={styles.input}
        placeholder="Szukaj pozycji menu"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={onChangeSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
        {categories.map(category => (
          <Pressable
            key={category.id}
            style={[styles.chip, selectedCategoryId === category.id && styles.chipActive]}
            onPress={() => onSelectCategory(category.id)}>
            <Text style={[styles.chipText, selectedCategoryId === category.id && styles.chipTextActive]}>{category.name}</Text>
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
          <Pressable style={styles.primaryButton} onPress={() => onAddItem(item)}>
            <Text style={styles.primaryButtonText}>Dodaj</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingBottom: 104},
  input: {backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, marginBottom: 12, padding: 14},
  categoryScroller: {marginBottom: 12},
  chip: {backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, marginRight: 8, paddingHorizontal: 14, paddingVertical: 9},
  chipActive: {backgroundColor: colors.primaryLight, borderColor: colors.primaryLight},
  chipText: {color: '#334e68', fontWeight: '800'},
  chipTextActive: {color: '#fff'},
  menuCard: {alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14},
  menuName: {color: colors.text, fontSize: 17, fontWeight: '800'},
  cardMuted: {color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4},
  amount: {color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 10},
  primaryButton: {backgroundColor: colors.primaryLight, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12},
  primaryButtonText: {color: '#fff', fontWeight: '800'},
  flexOne: {flex: 1},
});
