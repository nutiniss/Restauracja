import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {RestaurantTable, Waiter} from '../../domain/entities';
import {TableStatus} from '../../domain/enums/RestaurantEnums';
import {SectionTitle} from '../components/SectionTitle';
import {colors} from '../theme/colors';

export function WaitersScreen({waiters, tables}: {waiters: Waiter[]; tables: RestaurantTable[]}) {
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={waiters}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={<SectionTitle title="Kelnerzy" subtitle="Pracownicy obsługujący stoliki i rachunki." />}
      renderItem={({item}) => (
        <View style={styles.listCard}>
          <Text style={styles.menuName}>{item.fullName}</Text>
          <Text style={styles.cardMuted}>Kod: {item.code} • aktywny: {item.isActive ? 'tak' : 'nie'}</Text>
          <Text style={styles.cardText}>Aktualne stoliki: {tables.filter(table => table.waiterId === item.id && table.status !== TableStatus.Free).length}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingBottom: 104},
  listCard: {backgroundColor: colors.surface, borderRadius: 18, marginBottom: 10, padding: 14},
  menuName: {color: colors.text, fontSize: 17, fontWeight: '800'},
  cardMuted: {color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4},
  cardText: {color: '#334e68', fontSize: 14, marginTop: 8},
});
