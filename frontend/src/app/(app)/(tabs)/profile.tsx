import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const { user, refreshToken, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert('Вихід', 'Ти впевнений?', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Вийти',
        style: 'destructive',
        onPress: async () => {
          try {
            if (refreshToken) await authService.logout(refreshToken);
          } finally {
            await clearAuth();
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Вийти</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#666' },
  role: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  logoutText: { color: '#FF6B6B', fontWeight: '600', fontSize: 16 },
});
