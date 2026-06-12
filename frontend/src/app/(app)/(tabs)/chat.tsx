import { ChatListView } from '@/components/chat/ChatListView';

export default function ChatListScreen() {
  return <ChatListView roomPathname="/(app)/chat/[id]" />;
}
