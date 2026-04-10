export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  member_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  last_message_preview?: string;
  my_state?: {
    unread_count: number;
    last_delivered_message_id?: string | null;
    last_read_message_id?: string | null;
  };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
