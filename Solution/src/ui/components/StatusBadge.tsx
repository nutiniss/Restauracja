import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TableStatus} from '../../domain/enums/RestaurantEnums';
import {colors} from '../theme/colors';

const statusConfig: Record<TableStatus, [string, string]> = {
  [TableStatus.Free]: ['Wolny', colors.success],
  [TableStatus.Occupied]: ['Zajęty', colors.warning],
  [TableStatus.PartiallyPaid]: ['Częściowo', colors.info],
  [TableStatus.Paid]: ['Opłacony', colors.neutral],
};

export function StatusBadge({status}: {status: TableStatus}) {
  const [label, backgroundColor] = statusConfig[status];

  return (
    <View style={[styles.badge, {backgroundColor}]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4},
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '800'},
});
