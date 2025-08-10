'use client';

import { useState, useEffect, useRef } from 'react';
import { botApi } from '@/utils/api';
import { ChatMessage, TestChatSession } from '@/types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const TestChat = () => {
  const [session, setSession] = useState<TestChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createSession = async () => {
      setIsLoading(true); // Set loading true at the start
      try {
        console.log('🔵 Making API call to create session...');
        const response = await botApi.createTestChatSession();
        console.log('📥 Raw API response:', JSON.stringify(response, null, 2));
        console.log('📥 Response type:', typeof response);
        console.log('📥 Response.data:', response.data);
        console.log('📥 Response.data type:', typeof response.data);
        
        if (response.data) {
          console.log('📝 Session data:', JSON.stringify(response.data, null, 2));
          console.log('📝 Session ID:', response.data.id);
          console.log('📝 Session ID type:', typeof response.data.id);
          setSession(response.data);
          console.log('✅ Session set successfully');
        } else {
          console.error('❌ No session data in response');
        }
        setMessages([]);
      } catch (error) {
        console.error('❌ Failed to create chat session:', error);
        // You could add a system message here to inform the user
      } finally {
        setIsLoading(false); // Ensure loading is false at the end
      }
    };
    createSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    console.log('🚀 handleSendMessage called');
    console.log('📋 Current session state:', JSON.stringify(session, null, 2));
    console.log('📋 Session exists?', !!session);
    console.log('📋 Content:', content);
    console.log('📋 Content trimmed?', !!content.trim());
    
    if (!session) {
      console.error('❌ No session available');
      return;
    }
    
    if (!content.trim()) {
      console.error('❌ No content to send');
      return;
    }
    
    console.log('📋 Session ID from state:', session.id);
    console.log('📋 Session ID type:', typeof session.id);
    console.log('🚀 Proceeding with message send...');
    
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      console.log('📤 Sending to API with sessionId:', session.id);
      const { data: responseData } = await botApi.testChat(newMessages, session.id);
      if (responseData) {
        setMessages([...newMessages, responseData.response]);
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      const errorMessage: ChatMessage = { id: `error-${Date.now()}`, role: 'system', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Test Chat</h2>
        <p className="text-sm text-gray-500">Chat with your AI assistant to test its responses.</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start items-center">
            <div className="bg-gray-200 rounded-lg p-3 max-w-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default TestChat; 