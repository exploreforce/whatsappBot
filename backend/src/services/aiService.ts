import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ChatMessage } from '../types';
import { Database } from '../models/database';
import { getBusinessDaySlots, isTimeSlotAvailable } from '../utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Tool Definitions for OpenAI Function Calling ---

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'checkAvailability',
      description: 'Checks for available appointment slots on a given date.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The date to check for availability, in YYYY-MM-DD format.',
          },
          duration: {
            type: 'number',
            description: 'The duration of the appointment in minutes.',
          },
        },
        required: ['date', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bookAppointment',
      description: 'Books a new appointment with the customer.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: "The customer's full name." },
          customerPhone: { type: 'string', description: "The customer's phone number." },
          datetime: {
            type: 'string',
            description: 'The appointment start time in ISO 8601 format (e.g., 2024-07-25T14:30:00Z).',
          },
          duration: {
            type: 'number',
            description: 'The duration of the appointment in minutes.',
          },
          notes: {
            type: 'string',
            description: 'Any additional notes for the appointment.',
          },
        },
        required: ['customerName', 'customerPhone', 'datetime', 'duration'],
      },
    },
  },
];

// --- Tool Implementation ---

const executeTool = async (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) => {
  const toolName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`🤖 Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'checkAvailability':
      const { date, duration } = args;
      const availabilityConfig = await Database.getAvailabilityConfig();
      if (!availabilityConfig) {
        return { error: 'Could not retrieve availability configuration.' };
      }
      
      const dayOfWeek = new Date(date).getDay();
      const daySchedule = Object.values(availabilityConfig.weeklySchedule).find(d => d.dayOfWeek === dayOfWeek);

      if (!daySchedule || !daySchedule.isAvailable) {
        return { availableSlots: [] };
      }

      // This is a simplified example. A real implementation would be more complex.
      const allSlots = getBusinessDaySlots('09:00', '17:00', duration, 15);
      const bookedSlots = (await Database.getAppointments({ startDate: new Date(date) }))
        .map(appt => ({
          start: new Date(appt.datetime).toTimeString().substring(0, 5),
          end: new Date(new Date(appt.datetime).getTime() + appt.duration * 60000).toTimeString().substring(0, 5)
        }));
      
      const availableSlots = allSlots.filter(slot => isTimeSlotAvailable(slot.start, slot.end, bookedSlots));

      return { availableSlots };

    case 'bookAppointment':
      const { customerName, customerPhone, datetime, duration: apptDuration, notes } = args;
      const newAppointment = await Database.createAppointment({
        customerName,
        customerPhone,
        datetime: new Date(datetime),
        duration: apptDuration,
        notes,
        status: 'confirmed',
      });
      return { success: true, appointment: newAppointment };

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
};

// --- Main AI Service Logic ---

export class AIService {
  static async getChatResponse(
    messages: ChatMessage[],
    sessionId: string
  ): Promise<ChatMessage> {
    const botConfig = await Database.getBotConfig();
    if (!botConfig) {
      throw new Error('Bot configuration not found.');
    }

    console.log('🤖 AI Service: Bot config loaded:', { systemPrompt: botConfig.systemPrompt?.substring(0, 50) + '...' });

    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: botConfig.systemPrompt || 'You are a helpful AI assistant.',
    };
    
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content || '',
    })).filter(msg => msg.content.trim().length > 0) as OpenAI.Chat.ChatCompletionMessageParam[];

    console.log('🤖 AI Service: Sending to OpenAI:', { 
      systemMessage: typeof systemMessage.content === 'string' ? systemMessage.content.substring(0, 50) + '...' : 'Complex content',
      messageCount: conversationHistory.length 
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [systemMessage, ...conversationHistory],
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      // Execute tools and continue conversation
      const toolResults = await Promise.all(toolCalls.map(executeTool));
      
      const toolResponseMessage: OpenAI.Chat.ChatCompletionMessageParam = {
        role: 'assistant',
        tool_calls: toolCalls,
        content: null
      };

      const toolFeedbackMessages: OpenAI.Chat.ChatCompletionMessageParam[] = toolCalls.map((toolCall, i) => ({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify(toolResults[i]),
      }));
      
      // Send tool results back to the model
      const secondResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          systemMessage,
          ...conversationHistory,
          toolResponseMessage,
          ...toolFeedbackMessages,
        ],
      });

      const finalMessage = secondResponse.choices[0].message;
      return {
        id: '', // Will be set by the database
        role: 'assistant',
        content: finalMessage.content || '',
        timestamp: new Date(),
        metadata: {
          toolCalls: toolCalls.map((tc, i) => ({
            name: tc.function.name,
            parameters: JSON.parse(tc.function.arguments),
            result: toolResults[i],
            status: 'completed',
          }))
        }
      };
    } else {
      // Standard text response
      return {
        id: '',
        role: 'assistant',
        content: responseMessage.content || '',
        timestamp: new Date(),
      };
    }
  }
} 