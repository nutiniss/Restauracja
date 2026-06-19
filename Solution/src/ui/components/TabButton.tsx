import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';

export function TabButton({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {alignItems: 'center', borderRadius: 14, flex: 1, paddingVertical: 12},
  tabButtonActive: {backgroundColor: colors.primary},
  tabButtonText: {color: '#627d98', fontWeight: '800'},
  tabButtonTextActive: {color: '#fff'},
});
