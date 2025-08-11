import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Database } from '../models/database';
import { whatsappService } from '../services/whatsappService';
import { ChatMessage } from '../types';

const router = Router();

// Get bot configuration
router.get(
  '/config',
  asyncHandler(async (req: Request, res: Response) => {
    console.log('🔍 Bot API: Getting bot configuration...');
    const config = await Database.getBotConfig();
    console.log('🔍 Bot API: Bot config retrieved:', {
      hasConfig: !!config,
      configId: config?.id,
      configData: config ? 'Present' : 'Missing'
    });
    
    res.json({
      success: true,
      message: 'Bot configuration retrieved',
      data: config,
    });
  })
);

// Update bot configuration
router.put(
  '/config',
  asyncHandler(async (req: Request, res: Response) => {
    const updatedConfig = await Database.updateBotConfig(req.body);
    res.json({
      success: true,
      message: 'Bot configuration updated',
      data: updatedConfig,
    });
  })
);

// Test chat endpoint - verwendet identische Logik wie WhatsApp Chat
router.post(
  '/test-chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { messages, sessionId } = req.body as {
      messages: ChatMessage[];
      sessionId: string;
    };

    console.log('🔵 Test chat request:', { sessionId, messagesCount: messages?.length });

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Get the last user message
    const userMessage = messages[messages.length - 1];
    
    if (userMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    console.log('📝 Processing user message:', { sessionId, content: userMessage.content });

    // Use identical logic as WhatsApp chat (but without sending to WhatsApp)
    const aiResponse = await whatsappService.handleTestMessage(sessionId, userMessage.content);
    
    // Update session activity
    await Database.updateChatSessionActivity(sessionId);

    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    console.log(`✅ Test Chat: Response completed for session ${sessionId}`);
    return res.json({
      data: {
        response: aiResponse,
      }
    });
  })
);

// Create a new test chat session
router.post(
  '/test-chat/session',
  asyncHandler(async (req: Request, res: Response) => {
    console.log('🔵 Creating new test chat session...');
    const session = await Database.createTestChatSession();
    console.log('📝 Session created:', JSON.stringify(session, null, 2));
    
    const responseData = {
      message: 'Test chat session created',
      data: session,
    };
    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
    
    return res.status(201).json(responseData);
  })
);

export default router; 