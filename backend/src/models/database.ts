import knex from 'knex';
import { BotConfig, Appointment, AvailabilityConfig, BlackoutDate, TestChatSession, ChatMessage, DbChatMessage, Service, CreateServiceRequest } from '../types';

const environment = process.env.NODE_ENV || 'development';
const config = require('../../knexfile')[environment];

export const db = knex(config);

// Database helper functions
export class Database {
  // Bot Config operations
  static async getBotConfig(): Promise<BotConfig | null> {
    const result = await db('bot_configs')
      .where('is_active', true)
      .first();
    
    if (!result) return null;
    
    // Transform database snake_case to TypeScript camelCase
    return {
      id: result.id,
      // Legacy fields
      systemPrompt: result.system_prompt || 'You are a helpful AI assistant.',
      tone: result.tone || 'friendly',
      businessHours: result.business_hours || '9:00-17:00',
      timezone: result.timezone || 'UTC',
      maxAppointmentDuration: result.max_appointment_duration || 120,
      bufferTime: result.buffer_time || 15,
      
      // New configuration fields
      botName: result.bot_name || 'AI Assistant',
      botDescription: result.bot_description || 'Ein hilfreicher AI-Assistent für Terminbuchungen',
      personalityTone: result.personality_tone || 'friendly',
      characterTraits: result.character_traits || 'Hilfsbereit, geduldig, verständnisvoll',
      backgroundInfo: result.background_info || 'Ich bin ein AI-Assistent, der dabei hilft, Termine zu koordinieren',
      servicesOffered: result.services_offered || 'Terminbuchung, Terminverwaltung, Informationen zu Verfügbarkeiten',
      escalationRules: result.escalation_rules || 'Bei komplexen Anfragen oder Beschwerden weiterleiten',
      botLimitations: result.bot_limitations || 'Keine medizinischen Beratungen, keine Rechtsberatung, keine persönlichen Informationen preisgeben',
      generatedSystemPrompt: result.generated_system_prompt,
      
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
    };
  }

  static async updateBotConfig(updates: Partial<BotConfig>): Promise<BotConfig> {
    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};
    
    if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt;
    if (updates.tone !== undefined) dbUpdates.tone = updates.tone;
    if (updates.businessHours !== undefined) dbUpdates.business_hours = updates.businessHours;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.maxAppointmentDuration !== undefined) dbUpdates.max_appointment_duration = updates.maxAppointmentDuration;
    if (updates.bufferTime !== undefined) dbUpdates.buffer_time = updates.bufferTime;
    
    // New fields
    if (updates.botName !== undefined) dbUpdates.bot_name = updates.botName;
    if (updates.botDescription !== undefined) dbUpdates.bot_description = updates.botDescription;
    if (updates.personalityTone !== undefined) dbUpdates.personality_tone = updates.personalityTone;
    if (updates.characterTraits !== undefined) dbUpdates.character_traits = updates.characterTraits;
    if (updates.backgroundInfo !== undefined) dbUpdates.background_info = updates.backgroundInfo;
    if (updates.servicesOffered !== undefined) dbUpdates.services_offered = updates.servicesOffered;
    if (updates.escalationRules !== undefined) dbUpdates.escalation_rules = updates.escalationRules;
    if (updates.botLimitations !== undefined) dbUpdates.bot_limitations = updates.botLimitations;
    if (updates.generatedSystemPrompt !== undefined) dbUpdates.generated_system_prompt = updates.generatedSystemPrompt;
    
    dbUpdates.updated_at = new Date();

    await db('bot_configs')
      .where('is_active', true)
      .update(dbUpdates);

    // Return the updated config
    return this.getBotConfig() as Promise<BotConfig>;
  }

  // Appointment operations
  static async getAppointments(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  } = {}): Promise<Appointment[]> {
    let query = db('appointments').select('*');
    
    if (filters.startDate) {
      query = query.where('datetime', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('datetime', '<=', filters.endDate);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    return query.orderBy('datetime', 'asc');
  }

  static async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const [created] = await db('appointments')
      .insert(appointment)
      .returning('*');
    return created;
  }

  static async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const [updated] = await db('appointments')
      .where('id', id)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }

  static async deleteAppointment(id: string): Promise<boolean> {
    const result = await db('appointments')
      .where('id', id)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });
    return result > 0;
  }

  // Availability operations
  static async getAvailabilityConfig(): Promise<AvailabilityConfig | null> {
    const result = await db('availability_configs')
      .where('is_active', true)
      .first();
    
    if (result) {
      result.weekly_schedule = JSON.parse(result.weekly_schedule);
    }
    
    return result || null;
  }

  static async updateAvailabilityConfig(weeklySchedule: any): Promise<AvailabilityConfig> {
    const [updated] = await db('availability_configs')
      .where('is_active', true)
      .update({
        weekly_schedule: JSON.stringify(weeklySchedule),
        updated_at: new Date()
      })
      .returning('*');
    
    updated.weekly_schedule = JSON.parse(updated.weekly_schedule);
    return updated;
  }

  // Blackout dates operations
  static async getBlackoutDates(startDate?: Date, endDate?: Date): Promise<BlackoutDate[]> {
    let query = db('blackout_dates').select('*');
    
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    
    return query.orderBy('date', 'asc');
  }

  static async addBlackoutDate(blackoutDate: Omit<BlackoutDate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlackoutDate> {
    const [created] = await db('blackout_dates')
      .insert(blackoutDate)
      .returning('*');
    return created;
  }

  static async removeBlackoutDate(id: string): Promise<boolean> {
    const result = await db('blackout_dates')
      .where('id', id)
      .del();
    return result > 0;
  }

  // Test chat operations
  static async createTestChatSession(): Promise<TestChatSession> {
    console.log('💾 Database: Creating test chat session...');
    
    try {
      const [insertResult] = await db('test_chat_sessions')
        .insert({})
        .returning('id');
      
      console.log('💾 Database: Insert result:', insertResult, 'Type:', typeof insertResult);
      
      let recordId: number;
      if (typeof insertResult === 'number') {
        recordId = insertResult;
      } else if (insertResult && typeof insertResult === 'object' && insertResult.id) {
        recordId = insertResult.id;
      } else {
        throw new Error('Could not determine record ID from insert result');
      }
      
      console.log('💾 Database: Determined record ID:', recordId);
      
      // Fetch the full record
      const created = await db('test_chat_sessions')
        .where('id', recordId)
        .first();
      
      console.log('💾 Database: Full created record:', JSON.stringify(created, null, 2));
      
      if (!created) {
        throw new Error(`Could not find created record with ID: ${recordId}`);
      }
      
      // Transform database response to match frontend interface
      const transformedSession = {
        id: String(created.id), // Convert number to string for frontend compatibility
        messages: [],
        createdAt: created.created_at ? new Date(created.created_at).toISOString() : new Date().toISOString(),
        lastActivity: created.last_activity ? new Date(created.last_activity).toISOString() : 
                     created.updated_at ? new Date(created.updated_at).toISOString() : new Date().toISOString()
      };
      
      console.log('💾 Database: Transformed session:', JSON.stringify(transformedSession, null, 2));
      
      return transformedSession;
    } catch (error) {
      console.error('💾 Database: Error creating test chat session:', error);
      throw error;
    }
  }

  static async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return db('chat_messages')
      .where('session_id', parseInt(sessionId, 10))
      .orderBy('timestamp', 'asc');
  }

  static async addChatMessage(message: DbChatMessage): Promise<ChatMessage> {
    const messageToInsert = {
      ...message,
      session_id: parseInt(message.session_id, 10) // Convert string to number for database
    };

    const [created] = await db('chat_messages')
      .insert(messageToInsert)
      .returning('*');
    return created;
  }

  static async updateChatMessage(id: string, updates: Partial<DbChatMessage>): Promise<ChatMessage | null> {
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;

    const [updated] = await db('chat_messages')
      .where('id', parseInt(id, 10))
      .update(dbUpdates)
      .returning('*');
    return updated || null;
  }

  static async updateChatSessionActivity(sessionId: string): Promise<void> {
    await db('test_chat_sessions')
      .where('id', parseInt(sessionId, 10))
      .update({ last_activity: new Date() });
  }

  // Services operations
  static async getServices(botConfigId: string): Promise<Service[]> {
    try {
      const results = await db('services')
        .where({ bot_config_id: botConfigId, is_active: true })
        .orderBy('sort_order', 'asc')
        .orderBy('name', 'asc');
      
      return results.map(service => ({
        id: service.id,
        botConfigId: service.bot_config_id,
        name: service.name,
        description: service.description,
        price: parseFloat(service.price),
        currency: service.currency,
        durationMinutes: service.duration_minutes,
        isActive: Boolean(service.is_active),
        sortOrder: service.sort_order,
        createdAt: new Date(service.created_at),
        updatedAt: new Date(service.updated_at)
      }));
    } catch (error) {
      console.error('Error getting services:', error);
      throw error;
    }
  }

  static async createService(botConfigId: string, serviceData: CreateServiceRequest): Promise<Service> {
    const [created] = await db('services')
      .insert({
        bot_config_id: botConfigId,
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        currency: serviceData.currency || 'EUR',
        duration_minutes: serviceData.durationMinutes,
        sort_order: serviceData.sortOrder || 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return {
      id: created.id,
      botConfigId: created.bot_config_id,
      name: created.name,
      description: created.description,
      price: parseFloat(created.price),
      currency: created.currency,
      durationMinutes: created.duration_minutes,
      isActive: created.is_active,
      sortOrder: created.sort_order,
      createdAt: new Date(created.created_at),
      updatedAt: new Date(created.updated_at)
    };
  }

  static async updateService(serviceId: string, updates: Partial<CreateServiceRequest>): Promise<Service> {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    
    dbUpdates.updated_at = new Date();

    await db('services')
      .where('id', serviceId)
      .update(dbUpdates);

    const [updated] = await db('services').where('id', serviceId);
    
    return {
      id: updated.id,
      botConfigId: updated.bot_config_id,
      name: updated.name,
      description: updated.description,
      price: parseFloat(updated.price),
      currency: updated.currency,
      durationMinutes: updated.duration_minutes,
      isActive: updated.is_active,
      sortOrder: updated.sort_order,
      createdAt: new Date(updated.created_at),
      updatedAt: new Date(updated.updated_at)
    };
  }

  static async deleteService(serviceId: string): Promise<void> {
    await db('services')
      .where('id', serviceId)
      .update({ is_active: false, updated_at: new Date() });
  }
}

export default db; 