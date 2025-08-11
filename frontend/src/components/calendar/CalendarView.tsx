'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useApi, useFetch } from '@/hooks/useApi';
import { appointmentsApi, botApi, servicesApi } from '@/utils/api';
import { Appointment, Service } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventsChange: () => void;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  selectedSlot?: { start: Date; end: Date } | null;
  onSave: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  selectedSlot,
  onSave
}) => {
  const { execute: createAppointment, isLoading: isCreating } = useApi();
  const { execute: updateAppointment, isLoading: isUpdating } = useApi();
  const { execute: deleteAppointment, isLoading: isDeleting } = useApi();
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    customerName: appointment?.customerName || '',
    customerPhone: appointment?.customerPhone || '',
    customerEmail: appointment?.customerEmail || '',
    datetime: appointment ? 
      moment(appointment.datetime).format('YYYY-MM-DDTHH:mm') : 
      selectedSlot ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm') : '',
    duration: appointment?.duration || 60,
    notes: appointment?.notes || '',
    serviceId: appointment?.appointmentType || ''
  });
  
  // Load bot config and services
  const { data: botConfig } = useFetch(() => botApi.getConfig(), []);
  
  useEffect(() => {
    if (botConfig?.id) {
      servicesApi.getAll(botConfig.id).then(response => {
        if (response.success && response.data) {
          setServices(response.data);
          // Set default service if available and form is empty
          if (response.data.length > 0 && !formData.serviceId) {
            const defaultService = response.data[0];
            setSelectedService(defaultService);
            setFormData(prev => ({ 
              ...prev, 
              duration: defaultService.durationMinutes || 60,
              serviceId: defaultService.id 
            }));
          }
        }
      }).catch(console.error);
    }
  }, [botConfig?.id, formData.serviceId]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert services to select options
  const serviceOptions = services.map(service => ({
    value: service.id,
    label: `${service.name} (${service.durationMinutes}min)${service.price ? ` - ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: service.currency || 'EUR' }).format(service.price)}` : ''}`
  }));

  // Fallback options if no services are configured
  const fallbackOptions = [
    { value: 'consultation', label: 'Beratung (60min)' },
    { value: 'checkup', label: 'Untersuchung (30min)' },
    { value: 'followup', label: 'Nachkontrolle (45min)' },
    { value: 'treatment', label: 'Behandlung (90min)' }
  ];

  const appointmentOptions = serviceOptions.length > 0 ? serviceOptions : fallbackOptions;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // When service changes, update duration automatically
    if (field === 'serviceId') {
      const service = services.find(s => s.id === value);
      if (service) {
        setSelectedService(service);
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          duration: service.durationMinutes || 60 
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Prepare appointment data - only include fields expected by backend
      const appointmentData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        datetime: formData.datetime, // NO TIMEZONE CONVERSION - use local datetime as-is
        duration: formData.duration,
        notes: formData.notes,
        appointmentType: formData.serviceId || 'general' // Use serviceId as appointmentType
      };
      
      if (appointment) {
        // Update existing appointment
        await updateAppointment(() => appointmentsApi.update(appointment.id, appointmentData));
      } else {
        // Create new appointment
        await createAppointment(() => appointmentsApi.create(appointmentData));
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSave();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err?.error?.message || err?.message || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
    if (confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) {
      try {
        await deleteAppointment(() => appointmentsApi.cancel(appointment.id));
        onSave();
        onClose();
      } catch (err: any) {
        setError(err?.error?.message || err?.message || 'Fehler beim Löschen');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {appointment ? 'Termin bearbeiten' : 'Neuer Termin'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {saveSuccess && (
          <Alert type="success" message="Termin erfolgreich gespeichert!" />
        )}

        {error && (
          <Alert type="error" message={error} />
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-700">Kundendaten</span>
          </div>
          
          <Input
            label="Kundenname"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            placeholder="Max Mustermann"
            required
          />

          <Input
            label="Telefonnummer"
            value={formData.customerPhone}
            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
            placeholder="+49 123 456789"
            required
          />

          <Input
            label="E-Mail (optional)"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
            placeholder="max@example.com"
          />

          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-700">Termindetails</span>
          </div>

          <Input
            label="Datum & Uhrzeit"
            type="datetime-local"
            value={formData.datetime}
            onChange={(e) => handleInputChange('datetime', e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dauer (Minuten)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              min="15"
              max="240"
              step="15"
            />

            <Select
              label="Service"
              value={formData.serviceId}
              onChange={(e) => handleInputChange('serviceId', e.target.value)}
              options={appointmentOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          {appointment && (
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Lösche...' : 'Löschen'}
            </Button>
          )}
          
          <div className="flex space-x-2 ml-auto">
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) ? 'Speichere...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventsChange }) => {
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setSelectedSlot(null);
    setShowModal(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setSelectedSlot({ start, end });
    setShowModal(true);
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  };

  const handleSaveAppointment = () => {
    onEventsChange();
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3174ad';
    
    switch (appointment.status) {
      case 'confirmed':
        backgroundColor = '#10b981';
        break;
      case 'pending':
        backgroundColor = '#f59e0b';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
      case 'completed':
        backgroundColor = '#6b7280';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
    },
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
    }
  };

  return (
    <div className="h-[70vh] relative">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Bestätigt</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Ausstehend</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Abgesagt</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-600">Abgeschlossen</span>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setSelectedEvent(null);
            setSelectedSlot({ 
              start: new Date(), 
              end: moment().add(1, 'hour').toDate() 
            });
            setShowModal(true);
          }}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Neuer Termin</span>
        </Button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        formats={formats}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        defaultView={Views.WEEK}
        step={15}
        timeslots={4}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
        messages={{
          next: 'Weiter',
          previous: 'Zurück',
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag',
          agenda: 'Agenda',
          date: 'Datum',
          time: 'Zeit',
          event: 'Termin',
          noEventsInRange: 'Keine Termine in diesem Zeitraum.',
          showMore: (total) => `+ ${total} weitere`
        }}
      />

      <AppointmentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        appointment={selectedEvent}
        selectedSlot={selectedSlot}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};

export default CalendarView; 