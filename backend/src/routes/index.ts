import { Router } from 'express';
import botRoutes from './bot';
import calendarRoutes from './calendar';
import appointmentRoutes from './appointments';
import whatsappRoutes from './whatsapp';
import servicesRoutes from './services';
import authRoutes from './auth';

const router = Router();

// API route groups
router.use('/bot', botRoutes);
router.use('/calendar', calendarRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/services', servicesRoutes);
router.use('/auth', authRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Bot API',
    version: '1.0.0',
    endpoints: {
      bot: '/api/bot',
      calendar: '/api/calendar',
      appointments: '/api/appointments',
      whatsapp: '/api/whatsapp',
      services: '/api/services',
    }
  });
});

export default router; 