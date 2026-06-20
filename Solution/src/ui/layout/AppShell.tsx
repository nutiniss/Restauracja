import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserSession } from '../../domain/entities/UserSession';
import { TabButton } from '../components/TabButton';
import { colors } from '../theme/colors';

export type AppMode = 'service' | 'admin';
export type AppTab = 'tables' | 'menu' | 'waiters' | 'history' | 'admin';

export function AppShell({
  activeTab,
  mode,
  onChangeMode,
  onChangeTab,
  onLogout,
  apiStatus,
  currentUser,
  children,
}: {
  activeTab: AppTab;
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  onChangeTab: (tab: AppTab) => void;
  onLogout: () => void;
  apiStatus?: string;
  currentUser: UserSession;
  children: React.ReactNode;
}) {
  const canUseAdmin = currentUser.role === 'admin';

  const switchMode = (nextMode: AppMode) => {
    if (nextMode === 'admin' && !canUseAdmin) {
      return;
    }

    onChangeMode(nextMode);
    onChangeTab(nextMode === 'admin' ? 'admin' : 'tables');
  };

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RestauracjaPOS</Text>
        <Text style={styles.title}>
          {mode === 'admin'
            ? 'Panel administracji'
            : 'Mobilny system obsługi sali'}
        </Text>
        <View style={styles.userBar}>
          <Text style={styles.userText}>
            Zalogowano: {currentUser.displayName} ({currentUser.username})
          </Text>
          <Text style={styles.roleText}>
            Rola: {currentUser.role === 'admin' ? 'administrator' : 'kelner'}
          </Text>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Wyloguj</Text>
          </Pressable>
        </View>
        <View style={styles.modeSwitcher}>
          <ModeButton
            label="Obsługa sali"
            active={mode === 'service'}
            onPress={() => switchMode('service')}
          />
          {canUseAdmin && (
            <ModeButton
              label="Administracja"
              active={mode === 'admin'}
              onPress={() => switchMode('admin')}
            />
          )}
        </View>
        {apiStatus && <Text style={styles.apiStatus}>{apiStatus}</Text>}
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.tabs}>
        {mode === 'service' ? (
          <>
            <TabButton
              label="Sala"
              active={activeTab === 'tables'}
              onPress={() => onChangeTab('tables')}
            />
            <TabButton
              label="Menu"
              active={activeTab === 'menu'}
              onPress={() => onChangeTab('menu')}
            />
            <TabButton
              label="Kelnerzy"
              active={activeTab === 'waiters'}
              onPress={() => onChangeTab('waiters')}
            />
            <TabButton
              label="Historia"
              active={activeTab === 'history'}
              onPress={() => onChangeTab('history')}
            />
          </>
        ) : (
          <TabButton
            label="Administracja"
            active={activeTab === 'admin'}
            onPress={() => onChangeTab('admin')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.modeButtonText, active && styles.modeButtonTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 18,
  },
  eyebrow: {
    color: '#9fb3c8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.background,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  userBar: {
    marginTop: 10,
  },
  userText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  roleText: { color: '#bcccdc', fontSize: 12, fontWeight: '700', marginTop: 2 },
  logoutButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutButtonText: { color: colors.background, fontWeight: '900' },
  apiStatus: {
    color: '#bcccdc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  modeSwitcher: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 4,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10,
  },
  modeButtonActive: { backgroundColor: colors.surface },
  modeButtonText: { color: '#d9e2ec', fontWeight: '900' },
  modeButtonTextActive: { color: colors.primary },
  tabs: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    left: 0,
    padding: 10,
    position: 'absolute',
    right: 0,
  },
});
