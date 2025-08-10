import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Database } from '../models/database';
import { AIService } from '../services/aiService';
import { ChatMessage } from '../types';

const router = Router();

// Get bot configuration
router.get(
  '/config',
  asyncHandler(async (req: Request, res: Response) => {
    const config = await Database.getBotConfig();
    res.json({
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
      message: 'Bot configuration updated',
      data: updatedConfig,
    });
  })
);

// Test chat endpoint
router.post(
  '/test-chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { messages, sessionId } = req.body as {
      messages: ChatMessage[];
      sessionId: string;
    };

    console.log('Test chat request:', { sessionId, messagesCount: messages?.length });

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Store user message
    const userMessage = messages[messages.length - 1];
    console.log('Storing user message:', { sessionId, role: userMessage.role, content: userMessage.content });
    
    await Database.addChatMessage({
      session_id: sessionId,
      role: userMessage.role,
      content: userMessage.content,
      timestamp: new Date(userMessage.timestamp),
    });

    // Get AI response
    const aiResponse = await AIService.getChatResponse(messages, sessionId);

    // Store AI response
    const storedAiResponse = await Database.addChatMessage({
      session_id: sessionId,
      role: aiResponse.role,
      content: aiResponse.content,
      timestamp: new Date(aiResponse.timestamp),
      metadata: aiResponse.metadata,
    });
    
    await Database.updateChatSessionActivity(sessionId);

    return res.json({
      data: {
        response: storedAiResponse,
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