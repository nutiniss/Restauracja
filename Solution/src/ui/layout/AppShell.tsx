import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {TabButton} from '../components/TabButton';
import {colors} from '../theme/colors';

export type AppTab = 'tables' | 'menu' | 'waiters' | 'history';

export function AppShell({
  activeTab,
  onChangeTab,
  children,
}: {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RestauracjaPOS</Text>
        <Text style={styles.title}>Mobilny system obsługi sali</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.tabs}>
        <TabButton label="Sala" active={activeTab === 'tables'} onPress={() => onChangeTab('tables')} />
        <TabButton label="Menu" active={activeTab === 'menu'} onPress={() => onChangeTab('menu')} />
        <TabButton label="Kelnerzy" active={activeTab === 'waiters'} onPress={() => onChangeTab('waiters')} />
        <TabButton label="Historia" active={activeTab === 'history'} onPress={() => onChangeTab('history')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {flex: 1, backgroundColor: colors.background},
  body: {flex: 1},
  header: {backgroundColor: colors.primary, paddingHorizontal: 20, paddingBottom: 18, paddingTop: 18},
  eyebrow: {color: '#9fb3c8', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase'},
  title: {color: colors.background, fontSize: 24, fontWeight: '800', marginTop: 4},
  tabs: {backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, flexDirection: 'row', gap: 6, left: 0, padding: 10, position: 'absolute', right: 0},
});
