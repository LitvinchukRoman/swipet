import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMessageTime } from '@/lib/format';
import { notify } from '@/lib/notify';
import { connectSocket, type ChatMessageDTO } from '@/lib/socket';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { chatService } from '@/services/chat';
import { useAuthStore } from '@/store/auth';

interface UIMessage {
  id: number;
  senderId: number;
  content: string;
  sentAt: string;
  pending?: boolean;
  clientMessageId?: string;
}

/** Унікальний клієнтський id для optimistic-повідомлення. */
function makeClientMessageId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TYPING_OFF_DELAY = 1500;

// ─────────────────────────────────────────────────────────────────────────────
//  ChatRoomView
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatRoomView() {
  const { id, shelterName, animalName } = useLocalSearchParams<{
    id: string; shelterName: string; animalName: string;
  }>();
  const roomId = Number(id);
  const insets = useSafeAreaInsets();

  const myId  = useAuthStore((s) => s.user?.id ?? 99);
  const token = useAuthStore((s) => s.accessToken);

  const [messages,    setMessages]    = useState<UIMessage[]>([]);
  const [text,        setText]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [socketLive,  setSocketLive]  = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const listRef          = useRef<FlatList<UIMessage>>(null);
  const typingOffTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent   = useRef(0);
  const inputRef         = useRef<TextInput>(null);

  // Send button scale
  const sendScale = useRef(new Animated.Value(1)).current;
  const animateSend = () => {
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, damping: 10, stiffness: 400 }),
      Animated.spring(sendScale, { toValue: 1,    useNativeDriver: true, damping: 10, stiffness: 300 }),
    ]).start();
  };

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const upsertMessage = useCallback(
    (m: ChatMessageDTO) => {
      setMessages((prev) => {
        if (m.senderId === myId) {
          // Точний матч за clientMessageId; фолбек на content для старих клієнтів.
          const idx = m.clientMessageId
            ? prev.findIndex((x) => x.pending && x.clientMessageId === m.clientMessageId)
            : prev.findIndex((x) => x.pending && x.content === m.content);
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
        setMessages(msgs.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt })));
        scrollToEnd(false);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    if (!token) return;

    const socket = connectSocket(token);

    const onConnect      = () => { setSocketLive(true); socket.emit('join_room', { roomId }); socket.emit('mark_read', { roomId }); };
    const onRoomJoined   = (p: { roomId: number; history: ChatMessageDTO[] }) => {
      if (p.roomId !== roomId) return;
      // Не затираємо optimistic-повідомлення, які ще не підтверджені сервером:
      // інакше пізній room_joined вбиває pending bubble (гонка REST ↔ socket).
      setMessages((prev) => {
        const history = p.history.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, sentAt: m.sentAt }));
        const stillPending = prev.filter(
          (x) => x.pending && !history.some((h) => h.senderId === x.senderId && h.content === x.content),
        );
        return [...history, ...stillPending];
      });
      scrollToEnd(false);
    };
    const onNewMessage   = (m: ChatMessageDTO) => { if (m.roomId !== roomId) return; upsertMessage(m); scrollToEnd(); };
    const onUserTyping   = (p: { roomId: number; userId: number; isTyping: boolean }) => {
      if (p.roomId !== roomId || p.userId === myId) return;
      setOtherTyping(p.isTyping);
    };
    const onConnectError = () => setSocketLive(false);

    socket.on('connect',       onConnect);
    socket.on('room_joined',   onRoomJoined);
    socket.on('new_message',   onNewMessage);
    socket.on('user_typing',   onUserTyping);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect',    onConnectError);
    if (socket.connected) onConnect();

    return () => {
      cancelled = true;
      socket.off('connect',       onConnect);
      socket.off('room_joined',   onRoomJoined);
      socket.off('new_message',   onNewMessage);
      socket.off('user_typing',   onUserTyping);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect',    onConnectError);
      // Залишаємо кімнату «м'яко»: знімаємо лише наші слухачі (вище) + typing off.
      // НЕ рвемо глобальний singleton-сокет — це робиться тільки на logout (clearAuth),
      // інакше швидка навігація між чатами дає цикли disconnect/reconnect і втрату подій.
      if (socket.connected) socket.emit('typing', { roomId, isTyping: false });
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

    // Офлайн: НЕ показуємо хибно «надіслане» повідомлення, яке не дійде до сервера.
    // Лишаємо текст у полі, щоб користувач повторив після відновлення зв'язку.
    if (!socketLive || !token) {
      notify('You’re offline', 'Reconnecting… your message hasn’t been sent yet.');
      return;
    }

    setText('');
    animateSend();

    const clientMessageId = makeClientMessageId();
    const socket = connectSocket(token);
    const optimistic: UIMessage = {
      id: -Date.now(),
      senderId: myId,
      content,
      sentAt: new Date().toISOString(),
      pending: true,
      clientMessageId,
    };
    setMessages((prev) => [...prev, optimistic]);
    socket.emit('send_message', { roomId, content, clientMessageId });
    socket.emit('typing', { roomId, isTyping: false });
    scrollToEnd();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Custom header ─────────────────────────────── */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.neutral[700]} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Title block — left aligned */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {shelterName ?? 'Conversation'}
          </Text>
          {animalName ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              about {animalName}
            </Text>
          ) : null}
        </View>

        {/* Connection status */}
        <View style={styles.statusWrap}>
          {socketLive
            ? <Wifi    size={16} color={Colors.success}        strokeWidth={2} />
            : <WifiOff size={16} color={Colors.neutral[300]}   strokeWidth={2} />
          }
          <Text style={[styles.statusText, { color: socketLive ? Colors.success : Colors.neutral[300] }]}>
            {socketLive ? 'live' : 'offline'}
          </Text>
        </View>
      </View>

      {/* ── Messages ──────────────────────────────────── */}
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
          renderItem={({ item }) => (
            <MessageBubble message={item} mine={item.senderId === myId} />
          )}
          ListFooterComponent={otherTyping ? <TypingIndicator /> : null}
        />
      )}

      {/* ── Input bar ─────────────────────────────────── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing[2] }]}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={handleChangeText}
          placeholder="Message…"
          placeholderTextColor={Colors.neutral[400]}
          multiline
          style={styles.input}
          onSubmitEditing={send}
        />
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            onPress={send}
            disabled={!text.trim()}
            activeOpacity={0.85}
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          >
            <Send size={18} color={Colors.neutral[0]} strokeWidth={2.2} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ message, mine }: { message: UIMessage; mine: boolean }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 260 }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        mine ? styles.rowMine : styles.rowTheirs,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <View
        style={[
          styles.bubble,
          mine   ? styles.bubbleMine   : styles.bubbleTheirs,
          message.pending && styles.bubblePending,
        ]}
      >
        <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timeText, mine ? styles.timeTextMine : styles.timeTextTheirs]}>
        {message.pending ? 'sending…' : formatMessageTime(message.sentAt)}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TypingIndicator
// ─────────────────────────────────────────────────────────────────────────────
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
          Animated.timing(dot, { toValue: 1,   duration: 320, useNativeDriver: true }),
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

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.primary[500],
    fontWeight: FontWeight.semibold,
    marginTop: 1,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── List
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[2],
  },

  // ── Bubbles
  bubbleRow: {
    maxWidth: '78%',
    gap: 3,
  },
  rowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
  },
  bubbleMine: {
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: Radius.sm,
    ...Shadow.orange,
  },
  bubbleTheirs: {
    backgroundColor: Colors.neutral[0],
    borderBottomLeftRadius: Radius.sm,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  bubblePending: {
    opacity: 0.55,
  },
  bubbleText: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.4,
  },
  textMine: {
    color: Colors.neutral[0],
    fontWeight: FontWeight.medium,
  },
  textTheirs: {
    color: Colors.neutral[800],
  },
  timeText: {
    fontSize: FontSize.xs,
    marginHorizontal: Spacing[1],
  },
  timeTextMine: {
    color: Colors.neutral[400],
  },
  timeTextTheirs: {
    color: Colors.neutral[400],
  },

  // ── Typing
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.neutral[400],
  },

  // ── Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[2],
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
    fontSize: FontSize.md,
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
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
  sendBtnDisabled: {
    backgroundColor: Colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
});