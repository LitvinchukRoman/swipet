import { Stack, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { formatMessageTime } from '@/lib/format';
import { connectSocket, disconnectSocket, type ChatMessageDTO } from '@/lib/socket';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { chatService } from '@/services/chat';
import { useAuthStore } from '@/store/auth';

interface UIMessage {
  id: number;
  senderId: number;
  content: string;
  sentAt: string;
  pending?: boolean;
}

const TYPING_OFF_DELAY = 1500;

// Спільний екран кімнати чату (REST-історія + socket realtime).
// Працює в обох оболонках — читає roomId з параметрів маршруту.
export default function ChatRoomView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);

  const myId = useAuthStore((s) => s.user?.id ?? 99);
  const token = useAuthStore((s) => s.accessToken);

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketLive, setSocketLive] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const listRef = useRef<FlatList<UIMessage>>(null);
  const typingOffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const upsertMessage = useCallback(
    (m: ChatMessageDTO) => {
      setMessages((prev) => {
        if (m.senderId === myId) {
          const idx = prev.findIndex((x) => x.pending && x.content === m.content);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = { id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt };
            return copy;
          }
        }
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, { id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt }];
      });
    },
    [myId],
  );

  useEffect(() => {
    let cancelled = false;

    chatService
      .getMessages(roomId)
      .then((msgs) => {
        if (cancelled) return;
        setMessages(
          msgs.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt })),
        );
        scrollToEnd(false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (!token) return;

    const socket = connectSocket(token);

    const onConnect = () => {
      setSocketLive(true);
      socket.emit('join_room', { roomId });
      socket.emit('mark_read', { roomId });
    };
    const onRoomJoined = (p: { roomId: number; history: ChatMessageDTO[] }) => {
      if (p.roomId !== roomId) return;
      setMessages(
        p.history.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt })),
      );
      scrollToEnd(false);
    };
    const onNewMessage = (m: ChatMessageDTO) => {
      if (m.roomId !== roomId) return;
      upsertMessage(m);
      scrollToEnd();
    };
    const onUserTyping = (p: { roomId: number; userId: number; isTyping: boolean }) => {
      if (p.roomId !== roomId || p.userId === myId) return;
      setOtherTyping(p.isTyping);
    };
    const onConnectError = () => setSocketLive(false);

    socket.on('connect', onConnect);
    socket.on('room_joined', onRoomJoined);
    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onConnectError);
    if (socket.connected) onConnect();

    return () => {
      cancelled = true;
      socket.off('connect', onConnect);
      socket.off('room_joined', onRoomJoined);
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onConnectError);
      if (socket.connected) socket.emit('typing', { roomId, isTyping: false });
      disconnectSocket();
      if (typingOffTimer.current) clearTimeout(typingOffTimer.current);
    };
  }, [roomId, token, myId, scrollToEnd, upsertMessage]);

  const handleChangeText = (value: string) => {
    setText(value);
    if (!socketLive) return;
    const socket = connectSocket(token!);
    const now = Date.now();
    if (now - lastTypingSent.current > 800) {
      lastTypingSent.current = now;
      socket.emit('typing', { roomId, isTyping: true });
    }
    if (typingOffTimer.current) clearTimeout(typingOffTimer.current);
    typingOffTimer.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
    }, TYPING_OFF_DELAY);
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    setText('');

    if (socketLive && token) {
      const socket = connectSocket(token);
      const optimistic: UIMessage = {
        id: -Date.now(),
        senderId: myId,
        content,
        sentAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      socket.emit('send_message', { roomId, content });
      socket.emit('typing', { roomId, isTyping: false });
    } else {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), senderId: myId, content, sentAt: new Date().toISOString() },
      ]);
    }
    scrollToEnd();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Розмова',
          headerRight: () => (
            <View style={styles.statusWrap}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: socketLive ? Colors.success : Colors.neutral[300] },
                ]}
              />
              <Text style={styles.statusText}>{socketLive ? 'онлайн' : 'офлайн'}</Text>
            </View>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => scrollToEnd(false)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MessageBubble message={item} mine={item.senderId === myId} />}
          ListFooterComponent={otherTyping ? <TypingIndicator /> : null}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={handleChangeText}
          placeholder="Повідомлення…"
          placeholderTextColor={Colors.neutral[400]}
          multiline
          style={styles.input}
        />
        <TouchableOpacity
          onPress={send}
          disabled={!text.trim()}
          activeOpacity={0.85}
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        >
          <Send size={20} color={Colors.neutral[0]} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, mine }: { message: UIMessage; mine: boolean }) {
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          message.pending && styles.bubblePending,
        ]}
      >
        <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.timeText}>{formatMessageTime(message.sentAt)}</Text>
    </View>
  );
}

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[styles.bubbleRow, styles.rowTheirs]}>
      <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing[4], gap: Spacing[2] },

  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], marginRight: Spacing[2] },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.xs, color: Colors.neutral[400], fontWeight: FontWeight.medium },

  bubbleRow: { maxWidth: '80%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: Radius.xl },
  bubbleMine: { backgroundColor: Colors.primary[500], borderBottomRightRadius: Radius.sm },
  bubbleTheirs: { backgroundColor: Colors.neutral[0], borderBottomLeftRadius: Radius.sm, ...Shadow.sm },
  bubblePending: { opacity: 0.6 },
  bubbleText: { fontSize: FontSize.base, lineHeight: FontSize.base * 1.35 },
  textMine: { color: Colors.neutral[0] },
  textTheirs: { color: Colors.neutral[800] },
  timeText: { fontSize: 10, color: Colors.neutral[400], marginTop: 2, marginHorizontal: Spacing[1] },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing[4] },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.neutral[400] },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[150],
    backgroundColor: Colors.neutral[0],
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.neutral[900],
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.orange,
  },
  sendBtnDisabled: { backgroundColor: Colors.neutral[300], shadowOpacity: 0 },
});
