import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Database } from '../models/database';
import { Appointment, TimeSlot } from '../types';
import { generateTimeSlots, isBlackoutDate } from '../utils/calendarUtils';
import moment from 'moment';

const router = Router();

// Get all appointments
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, status } = req.query;
  
  const appointments = await Database.getAppointments({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    status: status as 'confirmed' | 'cancelled' | undefined,
  });
  
  return res.json({
    appointments,
    total: appointments.length,
  });
}));

// Create new appointment
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { botId, customerName, customerPhone, datetime, duration, notes } = req.body;
  
  if (!botId || !customerName || !customerPhone || !datetime || !duration) {
    return res.status(400).json({ error: 'Missing required appointment information' });
  }

  const config = await Database.getAvailabilityConfig();
  if (!config) {
    return res.status(404).json({ error: 'Availability configuration not found' });
  }

  const requestedDateTime = moment.utc(datetime);
  const requestedDate = requestedDateTime.clone().startOf('day');

  if (isBlackoutDate(requestedDate, config.blackoutDates)) {
    return res.status(400).json({ error: 'The requested date is a blackout date' });
  }

  const allAppointments = await Database.getAppointments({
    startDate: requestedDate.toDate(),
    endDate: requestedDate.clone().endOf('day').toDate()
  });

  const potentialSlots = generateTimeSlots(requestedDate, config.weeklySchedule, duration);
  const requestedSlot = {
    start: requestedDateTime.format('HH:mm'),
    end: requestedDateTime.clone().add(duration, 'minutes').format('HH:mm'),
  };

  const isSlotAvailable = potentialSlots.some(
    (slot: TimeSlot) => slot.start === requestedSlot.start && slot.end === requestedSlot.end
  ) && !allAppointments.some((appt: Appointment) => {
    const apptStart = moment.utc(appt.datetime);
    const apptEnd = apptStart.clone().add(appt.duration, 'minutes');
    return requestedDateTime.isBetween(apptStart, apptEnd, undefined, '[)');
  });

  if (!isSlotAvailable) {
    return res.status(400).json({ error: 'The requested time slot is not available' });
  }

  const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
    customerName,
    customerPhone,
    datetime: requestedDateTime.toDate(),
    duration,
    status: 'confirmed',
    notes,
  };

  const newAppointment = await Database.createAppointment(newAppointmentData);
  
  return res.status(201).json({
    message: 'Appointment created successfully',
    appointment: newAppointment,
  });
}));

// Update appointment
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Partial<Appointment> = req.body;
  
  const updatedAppointment = await Database.updateAppointment(id, updates);

  if (!updatedAppointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  return res.json({
    message: 'Appointment updated successfully',
    appointment: updatedAppointment,
  });
}));

// Cancel appointment
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const updatedAppointment = await Database.updateAppointment(id, { status: 'cancelled' });

  if (!updatedAppointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  return res.json({
    message: 'Appointment cancelled successfully',
    appointmentId: id,
  });
}));

export default router; 