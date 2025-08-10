import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Database } from '../models/database';
import moment from 'moment';
import { Appointment, TimeSlot } from '../types';
import { generateTimeSlots, isBlackoutDate } from '../utils/calendarUtils';

const router = Router();

// Get availability slots
router.get('/availability', asyncHandler(async (req: Request, res: Response) => {
  const { botId, date, duration } = req.query;
  if (!botId || !date || !duration) {
    return res.status(400).json({ error: 'botId, date, and duration are required' });
  }

  const config = await Database.getAvailabilityConfig();
  if (!config) {
    return res.status(404).json({ error: 'Availability configuration not found' });
  }

  const requestedDate = moment.utc(date as string).startOf('day');
  if (isBlackoutDate(requestedDate, config.blackoutDates)) {
    return res.json({ date: requestedDate.format('YYYY-MM-DD'), availableSlots: [] });
  }

  const allAppointments: Appointment[] = await Database.getAppointments({
    startDate: requestedDate.toDate(),
    endDate: requestedDate.clone().endOf('day').toDate()
  });

  const potentialSlots = generateTimeSlots(requestedDate, config.weeklySchedule, parseInt(duration as string, 10));

  const availableSlots = potentialSlots.filter((slot: TimeSlot) => {
    const slotStart = requestedDate.clone().set({
      hour: parseInt(slot.start.split(':')[0], 10),
      minute: parseInt(slot.start.split(':')[1], 10),
    });

    return !allAppointments.some((appt: Appointment) => {
      const apptStart = moment.utc(appt.datetime);
      const apptEnd = apptStart.clone().add(appt.duration, 'minutes');
      return slotStart.isBetween(apptStart, apptEnd, undefined, '[)');
    });
  });

  return res.json({ date: requestedDate.format('YYYY-MM-DD'), availableSlots });
}));

// Create/update availability
router.put('/availability', asyncHandler(async (req: Request, res: Response) => {
  const { botId, weeklySchedule, blackoutDates } = req.body;
  if (!botId) {
    return res.status(400).json({ error: 'botId is required' });
  }

  const config = await Database.updateAvailabilityConfig(weeklySchedule);

  return res.json({
    message: 'Availability updated successfully',
    config,
  });
}));

// Get calendar overview
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const { botId, startDate, endDate } = req.query;
  if (!botId || !startDate || !endDate) {
    return res.status(400).json({ error: 'botId, startDate, and endDate are required' });
  }

  const config = await Database.getAvailabilityConfig();
  if (!config) {
    return res.status(404).json({ error: 'Availability configuration not found' });
  }

  const start = moment.utc(startDate as string).startOf('day');
  const end = moment.utc(endDate as string).endOf('day');

  const appointments: Appointment[] = await Database.getAppointments({
    startDate: start.toDate(),
    endDate: end.toDate()
  });

  let totalAvailableSlots = 0;
  for (let m = start.clone(); m.isBefore(end); m.add(1, 'days')) {
    if (isBlackoutDate(m, config.blackoutDates)) {
      continue;
    }
    const potentialSlots = generateTimeSlots(m, config.weeklySchedule, 30); // Assuming 30-min duration for overview
    const dayAppointments = appointments.filter((a: Appointment) => moment.utc(a.datetime).isSame(m, 'day'));
    
    const availableSlots = potentialSlots.filter((slot: TimeSlot) => {
      const slotStart = m.clone().set({
        hour: parseInt(slot.start.split(':')[0], 10),
        minute: parseInt(slot.start.split(':')[1], 10),
      });

      return !dayAppointments.some((appt: Appointment) => {
        const apptStart = moment.utc(appt.datetime);
        const apptEnd = apptStart.clone().add(appt.duration, 'minutes');
        return slotStart.isBetween(apptStart, apptEnd, undefined, '[)');
      });
    }).length;

    totalAvailableSlots += availableSlots;
  }

  return res.json({
    period: { startDate, endDate },
    totalAppointments: appointments.length,
    availableSlots: totalAvailableSlots,
    busySlots: appointments.length, // This is a simplification
  });
}));

export default router; 