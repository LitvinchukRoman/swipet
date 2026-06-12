import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { adminService, type AdminUser, type UserRole } from '@/services/admin';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'USER', label: 'Юзер' },
  { value: 'SHELTER_ADMIN', label: 'Притулок' },
  { value: 'ADMIN', label: 'Адмін' },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await adminService.getUsers());
    } catch {
      // лишаємо — нижче EmptyState
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const changeRole = async (user: AdminUser, role: UserRole) => {
    if (user.role === role) return;
    const ok = await confirm('Змінити роль?', `${user.fullName}: ${user.role} → ${role}`);
    if (!ok) return;

    const prev = user.role;
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
    try {
      await adminService.updateUserRole(user.id, role);
    } catch {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role: prev } : u)));
      notify('Помилка', 'Не вдалося змінити роль');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Користувачі</Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
          ListEmptyComponent={
            <View style={{ marginTop: Spacing[16] }}>
              <EmptyState title="Користувачів немає" subtitle="Список зʼявиться після реєстрацій" />
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(18)}>
              <UserRow user={item} onChangeRole={(role) => changeRole(item, role)} />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function UserRow({ user, onChangeRole }: { user: AdminUser; onChangeRole: (role: UserRole) => void }) {
  return (
    <View style={s.row}>
      <View style={s.rowTop}>
        <Avatar uri={user.avatarUrl} name={user.fullName} size={44} />
        <View style={{ flex: 1, marginLeft: Spacing[3] }}>
          <Text style={s.name} numberOfLines={1}>
            {user.fullName}
          </Text>
          <Text style={s.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={s.roleRow}>
        {ROLES.map((r) => {
          const active = user.role === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => onChangeRole(r.value)}
              style={[s.roleChip, active ? s.roleChipActive : s.roleChipIdle]}
            >
              <Text style={[s.roleChipText, { color: active ? Colors.neutral[0] : Colors.neutral[600] }]}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[900],
    letterSpacing: -0.6,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Spacing[4], paddingBottom: Layout.tabBarHeight + Spacing[8] },

  row: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  email: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 1 },

  roleRow: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[3] },
  roleChip: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  roleChipActive: { backgroundColor: Colors.primary[500] },
  roleChipIdle: { backgroundColor: Colors.neutral[100] },
  roleChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
