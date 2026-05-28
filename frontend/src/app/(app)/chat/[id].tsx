import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatMessageTime } from '@/lib/format';
import { chatService } from '@/services/chat';
import { useAuthStore } from '@/store/auth';
import type { ChatMessage } from '@/types/models';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const myId = useAuthStore((s) => s.user?.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    chatService.getMessages(roomId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    chatService.markRead(roomId);
    // TODO(socket): socket.emit('join_room', { roomId });
    //               socket.on('new_message', (m) => setMessages((prev) => [...prev, m]));
  }, [roomId]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    // TODO(socket): socket.emit('send_message', { roomId, content });
    const optimistic: ChatMessage = {
      id: Date.now(),
      roomId,
      senderId: myId ?? 99,
      content,
      isRead: false,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'Розмова' }} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} mine={item.senderId === (myId ?? 99)} />
          )}
        />
      )}

      {/* Поле вводу */}
      <View className="flex-row items-end gap-2 border-t border-gray-200 bg-white px-3 py-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Повідомлення..."
          multiline
          className="max-h-28 flex-1 rounded-2xl bg-gray-100 px-4 py-2.5 text-base"
        />
        <Pressable
          onPress={send}
          disabled={!text.trim()}
          className={`h-11 w-11 items-center justify-center rounded-full ${
            text.trim() ? 'bg-primary active:bg-primary-dark' : 'bg-gray-300'
          }`}
        >
          <Text className="text-lg text-white">➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <View className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-2.5 ${
          mine ? 'rounded-br-sm bg-primary' : 'rounded-bl-sm bg-white'
        }`}
      >
        <Text className={`text-base ${mine ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </Text>
      </View>
      <Text className={`mt-0.5 text-[10px] text-gray-400 ${mine ? 'text-right' : 'text-left'}`}>
        {formatMessageTime(message.sentAt)}
      </Text>
    </View>
  );
}
