import { ChatListView } from '@/components/chat/ChatListView';

/**
 * Chat list tab for users.
 * Displays all active conversations the user has with various shelters.
 */
export default function ChatListScreen() {
  return <ChatListView roomPathname="/(app)/chat/[id]" />;
}
