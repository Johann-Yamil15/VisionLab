// src/app/shared/models/chat-message.model.ts (O puedes definirlo aquí mismo)
export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}