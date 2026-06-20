import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  authenticateUser,
  UserSession,
  users,
} from '../../domain/entities/UserSession';
import { colors } from '../theme/colors';

export function LoginScreen({
  onLogin,
}: {
  onLogin: (user: UserSession) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const user = authenticateUser(username, password);

    if (!user) {
      setError('Nieprawidłowy login lub hasło. Spróbuj ponownie.');
      return;
    }

    setError('');
    onLogin(user);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>RestauracjaPOS</Text>
          <Text style={styles.title}>Zaloguj się do systemu</Text>
          <Text style={styles.subtitle}>
            Wybierz jedno z dwóch kont testowych. Kelner otrzymuje dostęp tylko
            do obsługi sali, menu, kelnerów i historii.
          </Text>

          <View style={styles.credentialsBox}>
            {users.map(user => (
              <Text key={user.username} style={styles.credentialsText}>
                {user.displayName}: {user.username} / {user.password}
              </Text>
            ))}
          </View>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={text => {
              setUsername(text);
              setError('');
            }}
            placeholder="Login"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={username}
          />
          <TextInput
            onChangeText={text => {
              setPassword(text);
              setError('');
            }}
            placeholder="Hasło"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={submit}>
            <Text style={styles.buttonText}>Zaloguj</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    maxWidth: 460,
    padding: 24,
    width: '100%',
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#627d98', fontSize: 15, lineHeight: 22, marginTop: 10 },
  credentialsBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    marginTop: 18,
    padding: 12,
  },
  credentialsText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  input: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { color: '#c92a2a', fontWeight: '800', marginTop: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    marginTop: 18,
    paddingVertical: 14,
  },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: '900' },
});
