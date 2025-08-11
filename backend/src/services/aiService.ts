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
      // Helper to normalize 'YYYY-MM-DD HH:mm' or ISO to 'HH:mm'
      const toHHmm = (dt: string): string => {
        const s = (dt || '').replace('T', ' ').replace('Z', ' ');
        const time = s.split(' ')[1] || '';
        return time.substring(0, 5);
      };

      // Helper to add minutes to 'HH:mm' without Date objects
      const addMinutesToHHmm = (hhmm: string, minutesToAdd: number): string => {
        const [hhStr, mmStr] = hhmm.split(':');
        const baseMinutes = parseInt(hhStr || '0', 10) * 60 + parseInt(mmStr || '0', 10);
        const total = (baseMinutes + (minutesToAdd || 0) + 24 * 60) % (24 * 60);
        const hh = String(Math.floor(total / 60)).padStart(2, '0');
        const mm = String(total % 60).padStart(2, '0');
        return `${hh}:${mm}`;
      };

      // Use string-only filters (no Date objects)
      const booked = await Database.getAppointments({ startDateStr: date, endDateStr: date });
      const bookedSlots = booked.map(appt => {
        const start = toHHmm(String(appt.datetime));
        const end = addMinutesToHHmm(start, appt.duration || 0);
        return { start, end };
      });
      
      const availableSlots = allSlots.filter(slot => isTimeSlotAvailable(slot.start, slot.end, bookedSlots));

      return { availableSlots };

    case 'bookAppointment':
      const { customerName, customerPhone, datetime, duration: apptDuration, notes } = args;
      // Normalize incoming datetime to local string 'YYYY-MM-DD HH:mm'
      const localDatetime = String(datetime).replace('T', ' ').replace('Z', '').slice(0, 16);
      const newAppointment = await Database.createAppointment({
        customer_name: customerName,
        customer_phone: customerPhone,
        datetime: localDatetime,
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

        const activeSystemPrompt = botConfig.generatedSystemPrompt || botConfig.systemPrompt || 'You are a helpful AI assistant.';
    const promptType = botConfig.generatedSystemPrompt ? 'generated' : 'legacy';
    
    // Content Filter Settings
    const allowExplicit = process.env.OPENAI_ALLOW_EXPLICIT === 'true';
    const contentFilterEnabled = process.env.OPENAI_CONTENT_FILTER !== 'false';
    
    console.log('🤖 AI Service: Bot config loaded:', {
      promptType,
      systemPrompt: activeSystemPrompt.substring(0, 50) + '...',
      allowExplicit,
      contentFilterEnabled
    });

    // Erweitere System Prompt basierend auf Einstellungen
    let extendedSystemPrompt = activeSystemPrompt + '\nAlways respond in the same language as the user\'s last message.';
    
    if (allowExplicit) {
      extendedSystemPrompt += `

CONTENT POLICY:
- Du kannst offen über alle Themen sprechen, einschließlich expliziter/erotischer Inhalte
- Achte darauf, dass der Nutzer volljährig ist (18+) bei expliziten Themen
- Verwende angemessene Sprache basierend auf dem Kontext
- Respektiere immer Grenzen und Einverständnis`;
    }

    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: extendedSystemPrompt,
    };
    
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content || '',
    })).filter(msg => msg.content.trim().length > 0) as OpenAI.Chat.ChatCompletionMessageParam[];

    console.log('🤖 AI Service: Sending to OpenAI:', { 
      systemMessage: typeof systemMessage.content === 'string' ? systemMessage.content.substring(0, 50) + '...' : 'Complex content',
      messageCount: conversationHistory.length 
    });

    // OpenAI API Call mit angepassten Content Filter Einstellungen
    const apiParams: any = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [systemMessage, ...conversationHistory],
      tools: tools,
      tool_choice: 'auto',
    };
    
    // Content Filter Parameter hinzufügen (falls unterstützt vom Model)
    if (!contentFilterEnabled) {
      // Hinweis: Nicht alle Modelle unterstützen diese Parameter
      // apiParams.moderation = false;
      console.log('🔓 Content filtering disabled via environment variable');
    }
    
    const response = await openai.chat.completions.create(apiParams);

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
      
      // Send tool results back to the model mit gleichen Content Filter Einstellungen
      const secondApiParams: any = {
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          systemMessage,
          ...conversationHistory,
          toolResponseMessage,
          ...toolFeedbackMessages,
        ],
      };
      
      if (!contentFilterEnabled) {
        // apiParams.moderation = false;
        console.log('🔓 Content filtering disabled for tool response');
      }
      
      const secondResponse = await openai.chat.completions.create(secondApiParams);

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