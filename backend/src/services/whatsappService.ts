import { Database } from '../models/database';
import { AIService } from './aiService';
import { TestChatSession, ChatMessage, DbChatMessage } from '../types';
import axios, { AxiosError } from 'axios';

class WhatsAppService {
  async findOrCreateSession(phoneNumber: string): Promise<TestChatSession> {
    // For now, we'll create a new session each time since the Database class
    // doesn't have phone-specific session methods
    const session = await Database.createTestChatSession();
    return session;
  }

  async getMessageHistory(sessionId: string): Promise<ChatMessage[]> {
    return Database.getChatMessages(sessionId);
  }

  async sendMessage(to: string, message: string): Promise<void> {
    const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: { body: message },
    };
    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(url, data, { headers });
      console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error sending WhatsApp message:', error.response?.data);
      } else {
        console.error('Error sending WhatsApp message:', error);
      }
    }
  }

  async handleIncomingMessage(from: string, messageBody: string) {
    const session = await this.findOrCreateSession(from);

    const userMessageData: DbChatMessage = {
      session_id: session.id,
      role: 'user',
      content: messageBody,
      timestamp: new Date(),
    };
    await Database.addChatMessage(userMessageData);

    const messageHistory = await this.getMessageHistory(session.id);

    const aiResponse = await AIService.getChatResponse(messageHistory, session.id);

    if (aiResponse.content) {
      await this.sendMessage(from, aiResponse.content);
      const aiMessageData: DbChatMessage = {
        session_id: session.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        metadata: aiResponse.metadata,
      };
      await Database.addChatMessage(aiMessageData);
    }
  }
}

export const whatsappService = new WhatsAppService(); 