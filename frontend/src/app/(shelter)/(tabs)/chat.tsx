import { ChatListView } from '@/components/chat/ChatListView';

/**
 * Chat list tab for shelters.
 * Displays all active conversations initiated by users regarding the shelter's animals.
 */
export default function ShelterChatListScreen() {
  return <ChatListView roomPathname="/(shelter)/chat/[id]" />;
}
