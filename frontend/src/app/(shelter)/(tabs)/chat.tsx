import { ChatListView } from '@/components/chat/ChatListView';

export default function ShelterChatListScreen() {
  return <ChatListView roomPathname="/(shelter)/chat/[id]" />;
}
