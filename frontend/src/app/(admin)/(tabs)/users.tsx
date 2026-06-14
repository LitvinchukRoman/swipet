import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
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



export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await adminService.getUsers());
    } catch {
      // keep list — EmptyState below
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
    const ok = await confirm('Change role?', `${user.fullName}: ${user.role} → ${role}`);
    if (!ok) return;

    const prev = user.role;
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
    try {
      await adminService.updateUserRole(user.id, role);
    } catch {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role: prev } : u)));
      notify('Error', "Couldn't change the role");
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Users</Text>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <SectionList
          sections={[
            { title: 'Admins', data: users.filter((u) => u.role === 'ADMIN') },
            { title: 'Shelters', data: users.filter((u) => u.role === 'SHELTER_ADMIN') },
            { title: 'Users', data: users.filter((u) => u.role === 'USER') },
          ].filter((s) => s.data.length > 0)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
          ListEmptyComponent={
            <View style={{ marginTop: Spacing[16] }}>
              <EmptyState title="No users" subtitle="The list appears after sign-ups" />
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={s.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay((index % 10) * 40).springify().damping(18)}>
              <UserRow user={item} onChangeRole={(role) => changeRole(item, role)} />
            </Animated.View>
          )}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

function UserRow({ user, onChangeRole }: { user: AdminUser; onChangeRole: (role: UserRole) => void }) {
  const isMainAdmin = user.email === 'admin@swipet.com';

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

      {user.role === 'USER' && (
        <Pressable onPress={() => onChangeRole('ADMIN')} style={s.actionBtn}>
          <Text style={s.actionBtnText}>Make Admin</Text>
        </Pressable>
      )}

      {user.role === 'ADMIN' && !isMainAdmin && (
        <Pressable onPress={() => onChangeRole('USER')} style={[s.actionBtn, s.actionBtnDanger]}>
          <Text style={[s.actionBtnText, s.actionBtnDangerText]}>Make User</Text>
        </Pressable>
      )}

      {user.role === 'SHELTER_ADMIN' && (
        <View style={s.badge}>
          <Text style={s.badgeText}>Managed via Shelters</Text>
        </View>
      )}

      {isMainAdmin && (
        <View style={s.badge}>
          <Text style={s.badgeText}>Main Admin</Text>
        </View>
      )}
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

  sectionHeader: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[800],
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[1],
  },

  actionBtn: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary[100],
    paddingVertical: 8,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.primary[700],
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  actionBtnDanger: {
    backgroundColor: Colors.neutral[100],
  },
  actionBtnDangerText: {
    color: Colors.neutral[600],
  },
  badge: {
    marginTop: Spacing[3],
    backgroundColor: Colors.neutral[100],
    paddingVertical: 8,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.neutral[500],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
