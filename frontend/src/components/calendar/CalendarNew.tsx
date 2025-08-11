'use client';

import React, { useState, useEffect } from 'react';
import { DayPilot, DayPilotCalendar, DayPilotMonth } from "@daypilot/daypilot-lite-react";
import { useFetch } from '@/hooks/useApi';
import { appointmentsApi } from '@/utils/api';
import { Appointment, ApiResponse } from '@/types';
import moment from 'moment';
import Button from '@/components/ui/Button';
import { 
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

interface CalendarNewProps {
  className?: string;
}

const CalendarNew: React.FC<CalendarNewProps> = ({ className = '' }) => {
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month');
  const [startDate, setStartDate] = useState(DayPilot.Date.today());
  interface CalendarEvent {
    id: string;
    text: string;
    start: DayPilot.Date;
    end: DayPilot.Date;
    backColor: string;
    data: Appointment;
  }
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch appointments data
  const { data: appointmentsData, refetch: refetchAppointments } = useFetch<ApiResponse<Appointment[]>>(
    () => appointmentsApi.getAll({
      startDate: startDate.firstDayOfMonth().toString('yyyy-MM-dd'),
      endDate: startDate.lastDayOfMonth().toString('yyyy-MM-dd'),
    }) as Promise<ApiResponse<Appointment[]>>,
    [startDate]
  );

  // Transform appointments to DayPilot events format
  useEffect(() => {
    if (appointmentsData?.data) {
      const dayPilotEvents = appointmentsData.data.map((appointment: Appointment) => ({
        id: appointment.id,
        text: `${appointment.customerName} - ${appointment.appointmentType}`,
        start: new DayPilot.Date(appointment.datetime),
        end: new DayPilot.Date(appointment.datetime).addMinutes(appointment.duration),
        backColor: getEventColor(appointment.status),
        data: appointment
      }));
      setEvents(dayPilotEvents);
    }
  }, [appointmentsData]);

  const getEventColor = (status: string) => {
    const colors = {
      confirmed: '#10b981',
      pending: '#f59e0b', 
      cancelled: '#ef4444',
      completed: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#3174ad';
  };

  // Calendar configuration for Month view
  const monthConfig = {
    viewType: "Month",
    startDate: startDate,
    events: events,
    cellHeight: 80,
    weekStarts: 1, // Monday
    headerHeight: 30,
    // Mobile optimizations
    cellHeaderHeight: 25,
    showWeekend: true,
    // Event handling
    onEventClick: async (args: any) => {
      const appointment = args.e.data;
      // TODO: Open appointment modal
      console.log('Event clicked:', appointment);
    },
    onTimeRangeSelect: async (args: any) => {
      // TODO: Create new appointment
      console.log('Time range selected:', args.start, args.end);
    },
    // Mobile-friendly context menu
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "View Details",
          onClick: (args: any) => {
            // TODO: Show appointment details
          }
        },
        {
          text: "Export to ICS",
          onClick: (args: any) => {
            exportSingleEventToICS(args.source.data);
          }
        }
      ]
    })
  } as const;

  // Calendar configuration for Week/Day views
  const calendarConfig = {
    viewType: view,
    startDate: startDate,
    events: events,
    cellHeight: 30,
    headerHeight: 30,
    hourWidth: 60,
    // Mobile optimizations
    cellHeaderHeight: 25,
    timeRangeSelectedHandling: "Enabled" as const,
    eventMoveHandling: "Update" as const,
    eventResizeHandling: "Update" as const,
    // Event handling
    onEventClick: async (args: any) => {
      const appointment = args.e.data;
      console.log('Event clicked:', appointment);
    },
    onTimeRangeSelect: async (args: any) => {
      console.log('Time range selected:', args.start, args.end);
    },
    onEventMove: async (args: any) => {
      // TODO: Update appointment time via API
      console.log('Event moved:', args);
    }
  } as const;

  // Export single event to ICS
  const exportSingleEventToICS = (appointment: Appointment) => {
    const icsContent = generateICSContent([appointment]);
    downloadICS(icsContent, `appointment-${appointment.customerName}.ics`);
  };

  // Export all events to ICS
  const exportAllToICS = () => {
    if (!appointmentsData?.data) return;
    
    const icsContent = generateICSContent(appointmentsData.data);
    const filename = `calendar-export-${DayPilot.Date.today().toString('yyyy-MM-dd')}.ics`;
    downloadICS(icsContent, filename);
  };

  // Generate ICS content
  const generateICSContent = (appointments: Appointment[]) => {
    const icsEvents = appointments.map(appointment => {
      const startDate = new DayPilot.Date(appointment.datetime);
      const endDate = startDate.addMinutes(appointment.duration);
      const startTime = startDate.toString().replace(/[-:]/g, '').replace('T', 'T').replace(/\.\d{3}/, '') + 'Z';
      const endTime = endDate.toString().replace(/[-:]/g, '').replace('T', 'T').replace(/\.\d{3}/, '') + 'Z';
      
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
    const newDate = view === 'Month' ? startDate.addMonths(-1) : 
                   view === 'Week' ? startDate.addDays(-7) : 
                   startDate.addDays(-1);
    setStartDate(newDate);
  };

  const navigateNext = () => {
    const newDate = view === 'Month' ? startDate.addMonths(1) : 
                   view === 'Week' ? startDate.addDays(7) : 
                   startDate.addDays(1);
    setStartDate(newDate);
  };

  const navigateToday = () => {
    setStartDate(DayPilot.Date.today());
  };

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
        <div className="daypilot-calendar-container" style={{ minHeight: '500px' }}>
          {view === 'Month' ? (
            <DayPilotMonth {...monthConfig} />
          ) : (
            <DayPilotCalendar {...calendarConfig} />
          )}
        </div>
      </div>

      {/* Mobile indicator */}
      <div className="sm:hidden p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <DevicePhoneMobileIcon className="h-4 w-4" />
          <span>Mobile-optimized view</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarNew;
