'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFetch } from '@/hooks/useApi';
import { appointmentsApi } from '@/utils/api';
import { Appointment, ApiResponse } from '@/types';
import Button from '@/components/ui/Button';
import { 
  CalendarDaysIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Declare global DayPilot
declare global {
  interface Window {
    DayPilot: any;
  }
}

interface CalendarLocalProps {
  className?: string;
}

const CalendarLocal: React.FC<CalendarLocalProps> = ({ className = '' }) => {
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Week');
  const [startDate, setStartDate] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [calendar, setCalendar] = useState<any>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load DayPilot script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/daypilot/daypilot-all.min.js';
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
      setStartDate(window.DayPilot.Date.today());
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Fetch appointments data
  const { data: appointmentsData, refetch: refetchAppointments } = useFetch<ApiResponse<Appointment[]>>(
    () => {
      if (!startDate) {
        const empty: ApiResponse<Appointment[]> = { success: true, data: [] };
        return Promise.resolve(empty);
      }
      return appointmentsApi.getAll({
        startDate: startDate.firstDayOfMonth().toString('yyyy-MM-dd'),
        endDate: startDate.lastDayOfMonth().toString('yyyy-MM-dd'),
      }) as Promise<ApiResponse<Appointment[]>>;
    },
    [startDate]
  );

  // Transform appointments to DayPilot events format
  useEffect(() => {
    if (appointmentsData?.data && window.DayPilot) {
      const dayPilotEvents = appointmentsData.data.map((appointment: Appointment) => ({
        id: appointment.id,
        text: `${appointment.customerName} - ${appointment.appointmentType}`,
        start: new window.DayPilot.Date(appointment.datetime),
        end: new window.DayPilot.Date(appointment.datetime).addMinutes(appointment.duration),
        backColor: getEventColor(appointment.status),
        data: appointment
      }));
      setEvents(dayPilotEvents);
    }
  }, [appointmentsData]);

  // Initialize calendar when script is loaded
  useEffect(() => {
    if (isScriptLoaded && calendarRef.current && startDate) {
      initializeCalendar();
    }
  }, [isScriptLoaded, view, startDate]);

  // Update events when they change
  useEffect(() => {
    if (calendar && events.length > 0) {
      calendar.events.list = events;
      calendar.update();
    }
  }, [events, calendar]);

  const getEventColor = (status: string) => {
    const colors = {
      confirmed: '#10b981',
      pending: '#f59e0b', 
      cancelled: '#ef4444',
      completed: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#3174ad';
  };

  const initializeCalendar = () => {
    if (!window.DayPilot || !calendarRef.current) return;

    let calendarInstance;

    if (view === 'Month') {
      calendarInstance = new window.DayPilot.Month(calendarRef.current, {
        viewType: "Month",
        startDate: startDate,
        events: events,
        cellHeight: 80,
        weekStarts: 1, // Monday
        headerHeight: 30,
        cellHeaderHeight: 25,
        showWeekend: true,
        // Event handling
        onEventClick: (args: any) => {
          const appointment = args.e.data;
          console.log('Event clicked:', appointment);
        },
        onTimeRangeSelect: (args: any) => {
          console.log('Time range selected:', args.start, args.end);
        },
        // Mobile-friendly context menu
        contextMenu: new window.DayPilot.Menu([
          {
            text: "View Details",
            onClick: (args: any) => {
              console.log('View details:', args.source.data);
            }
          },
          {
            text: "Export to ICS",
            onClick: (args: any) => {
              exportSingleEventToICS(args.source.data);
            }
          }
        ])
      });
    } else {
      calendarInstance = new window.DayPilot.Calendar(calendarRef.current, {
        viewType: view,
        startDate: startDate,
        events: events,
        cellHeight: 30,
        headerHeight: 30,
        hourWidth: 60,
        cellHeaderHeight: 25,
        timeRangeSelectedHandling: "Enabled",
        eventMoveHandling: "Update",
        eventResizeHandling: "Update",
        // Event handling
        onEventClick: (args: any) => {
          const appointment = args.e.data;
          console.log('Event clicked:', appointment);
        },
        onTimeRangeSelect: (args: any) => {
          console.log('Time range selected:', args.start, args.end);
        },
        onEventMove: (args: any) => {
          console.log('Event moved:', args);
        }
      });
    }

    calendarInstance.init();
    setCalendar(calendarInstance);
  };

  // Export single event to ICS
  const exportSingleEventToICS = (appointment: Appointment) => {
    const icsContent = generateICSContent([appointment]);
    downloadICS(icsContent, `appointment-${appointment.customerName}.ics`);
  };

  // Export all events to ICS
  const exportAllToICS = () => {
    if (!appointmentsData?.data || !window.DayPilot) return;
    
    const icsContent = generateICSContent(appointmentsData.data);
    const filename = `calendar-export-${window.DayPilot.Date.today().toString('yyyy-MM-dd')}.ics`;
    downloadICS(icsContent, filename);
  };

  // Generate ICS content
  const generateICSContent = (appointments: Appointment[]) => {
    if (!window.DayPilot) return '';
    
    const icsEvents = appointments.map(appointment => {
      const startDate = new window.DayPilot.Date(appointment.datetime);
      const endDate = startDate.addMinutes(appointment.duration);
      // Simple ISO string to ICS format conversion
      const startTime = startDate.toString().replace(/[-:]/g, '').replace('T', 'T').split('.')[0] + 'Z';
      const endTime = endDate.toString().replace(/[-:]/g, '').replace('T', 'T').split('.')[0] + 'Z';
      
      return `BEGIN:VEVENT
UID:${appointment.id}@whatsappbot
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${appointment.customerName} - ${appointment.appointmentType}
DESCRIPTION:${appointment.notes || 'WhatsApp Bot Appointment'}
LOCATION:WhatsApp Bot
STATUS:${appointment.status.toUpperCase()}
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WhatsApp Bot//WhatsApp Bot Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`;
  };

  // Download ICS file
  const downloadICS = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Navigation functions
  const navigatePrevious = () => {
    if (!startDate) return;
    const newDate = view === 'Month' ? startDate.addMonths(-1) : 
                   view === 'Week' ? startDate.addDays(-7) : 
                   startDate.addDays(-1);
    setStartDate(newDate);
  };

  const navigateNext = () => {
    if (!startDate) return;
    const newDate = view === 'Month' ? startDate.addMonths(1) : 
                   view === 'Week' ? startDate.addDays(7) : 
                   startDate.addDays(1);
    setStartDate(newDate);
  };

  const navigateToday = () => {
    if (window.DayPilot) {
      setStartDate(window.DayPilot.Date.today());
    }
  };

  if (!isScriptLoaded || !startDate) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DayPilot Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header with mobile-optimized controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* View selector - Stack on mobile */}
          <div className="flex flex-wrap gap-2">
            {(['Month', 'Week', 'Day'] as const).map((v) => (
              <Button
                key={v}
                onClick={() => setView(v)}
                variant={view === v ? 'primary' : 'secondary'}
                className="text-sm px-3 py-2"
              >
                {v}
              </Button>
            ))}
          </div>
          
          {/* Export button */}
          <Button
            onClick={exportAllToICS}
            variant="secondary"
            className="flex items-center space-x-2 text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export ICS</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-4">
          <Button onClick={navigatePrevious} variant="secondary" className="px-3 py-1">
            ←
          </Button>
          
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {view === 'Month' ? startDate.toString('MMMM yyyy') : 
               view === 'Week' ? `Week of ${startDate.toString('MMM dd, yyyy')}` : 
               startDate.toString('MMMM dd, yyyy')}
            </h2>
            <Button onClick={navigateToday} variant="secondary" className="text-sm px-3 py-1">
              Today
            </Button>
          </div>
          
          <Button onClick={navigateNext} variant="secondary" className="px-3 py-1">
            →
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="p-4">
        <div 
          ref={calendarRef}
          className="daypilot-calendar-container" 
          style={{ minHeight: '500px' }}
        />
      </div>


    </div>
  );
};

export default CalendarLocal;
