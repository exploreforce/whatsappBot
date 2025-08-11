'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFetch, useApi } from '@/hooks/useApi';
import { appointmentsApi, botApi, servicesApi } from '@/utils/api';
import { Appointment, Service, ApiResponse } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { 
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Declare global DayPilot
declare global {
  interface Window {
    DayPilot: any;
  }
}

interface CalendarProProps {
  className?: string;
}

const CalendarPro: React.FC<CalendarProProps> = ({ className = '' }) => {
  const [view, setView] = useState<'Month' | 'Week' | 'Day' | 'Resources'>('Week');
  const [startDate, setStartDate] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [calendar, setCalendar] = useState<any>(null);
  // const [navigator, setNavigator] = useState<any>(null); // Removed Navigator
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  // const navigatorRef = useRef<HTMLDivElement>(null); // Removed Navigator
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  // Modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedSlot, setSelectedSlot] = useState<{start: any, end: any} | null>(null);

  // API hooks
  const { execute: createAppointment, isLoading: isCreating } = useApi();
  const { execute: updateAppointment, isLoading: isUpdating } = useApi();
  const { execute: deleteAppointment, isLoading: isDeleting } = useApi();

  // Load DayPilot scripts
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        await loadScript('/daypilot/daypilot-all.min.js');
        // await loadScript('/daypilot/daypilot-navigator.min.js'); // Removed Navigator
        await loadScript('/daypilot/daypilot-modal.min.js');
        await loadScript('/daypilot/daypilot-datepicker.min.js');
        await loadScript('/daypilot/daypilot-scheduler.min.js');
        
        setIsScriptLoaded(true);
        setStartDate(window.DayPilot.Date.today());
      } catch (error) {
        console.error('Error loading DayPilot scripts:', error);
      }
    };

    loadAllScripts();
  }, []);

  // Fetch appointments and services
  const { data: appointmentsData, refetch: refetchAppointments } = useFetch<ApiResponse<Appointment[]>>(
    () => {
      if (!startDate) {
        console.log('🔍 No startDate - returning empty appointments');
        return Promise.resolve({ success: true, data: [] as Appointment[] });
      }
      
      const startDateStr = startDate.firstDayOfMonth().toString('yyyy-MM-dd');
      const endDateStr = startDate.lastDayOfMonth().toString('yyyy-MM-dd');
      
      console.log('🔍 Fetching appointments for date range:', {
        startDate: startDateStr,
        endDate: endDateStr,
        currentMonth: startDate.toString('MMMM yyyy')
      });
      
      return appointmentsApi.getAll({
        startDate: startDateStr,
        endDate: endDateStr,
      });
    },
    [startDate]
  );

  const { data: botConfig, isLoading: botConfigLoading, error: botConfigError } = useFetch(() => botApi.getConfig(), []);
  
  // Debug botConfig loading
  useEffect(() => {
    console.log('🔍 CalendarPro: BotConfig loading state:');
    console.log('  - isLoading:', botConfigLoading);
    console.log('  - error:', botConfigError);
    console.log('  - botConfig:', botConfig);
    console.log('  - hasId:', !!botConfig?.data?.id);
    console.log('  - botConfig.data.id:', botConfig?.data?.id);
  }, [botConfig, botConfigLoading, botConfigError]);

  // Fetch services
  useEffect(() => {
    console.log('🚀 SERVICES USEEFFECT TRIGGERED!');
    console.log('🔍 CalendarPro: Bot config loaded:', botConfig);
    console.log('🔍 CalendarPro: botConfig?.data?.id exists?', !!botConfig?.data?.id);
    console.log('🔍 CalendarPro: botConfig?.data?.id value:', botConfig?.data?.id);
    
    if (botConfig?.data?.id) {
      console.log('🔍 CalendarPro: Fetching services for botConfig.data.id:', botConfig.data.id);
      console.log('🔍 CalendarPro: About to call servicesApi.getAll...');
      
      servicesApi.getAll(botConfig.data.id)
        .then(response => {
          console.log('🔍 CalendarPro: Services API response:', response);
          console.log('🔍 CalendarPro: Response type:', typeof response);
          console.log('🔍 CalendarPro: Response success:', response?.success);
          console.log('🔍 CalendarPro: Response data:', response?.data);
          
          if (response && response.success && Array.isArray(response.data)) {
            console.log('✅ CalendarPro: Services loaded successfully:', response.data);
            console.log('✅ CalendarPro: Services count:', response.data.length);
            setServices(response.data);
          } else {
            console.warn('⚠️ CalendarPro: Services response invalid:', response);
            console.warn('⚠️ CalendarPro: Setting empty services array');
            setServices([]); // Set empty array as fallback
          }
        })
        .catch(error => {
          console.error('❌ CalendarPro: Error loading services:', error);
          console.error('❌ CalendarPro: Error details:', error?.message || 'Unknown error');
          console.error('❌ CalendarPro: Setting empty services array');
          setServices([]); // Set empty array as fallback
        });
    } else {
      console.warn('⚠️ CalendarPro: Bot config ID not available');
      console.warn('⚠️ CalendarPro: BotConfig:', botConfig);
      console.warn('⚠️ CalendarPro: Setting empty services array due to no bot config ID');
      setServices([]);
    }
  }, [botConfig?.data?.id]);

  // Transform appointments to DayPilot events format
  useEffect(() => {
    console.log('🔄 appointmentsData changed:', {
      success: appointmentsData?.success,
      dataLength: appointmentsData?.data?.length || 0,
      data: appointmentsData?.data
    });
    
    if (appointmentsData?.data && window.DayPilot) {
      console.log('🔄 Processing', appointmentsData.data.length, 'appointments for calendar display');
      
      // Exclude cancelled appointments from calendar view
      const visibleAppointments = appointmentsData.data.filter((a: Appointment) => a.status !== 'cancelled');
      
      const dayPilotEvents = visibleAppointments.map((appointment: Appointment) => {
        console.log('🔄 Processing appointment:', {
          id: appointment.id,
          customerName: appointment.customerName,
          datetime: appointment.datetime,
          status: appointment.status,
          appointmentType: appointment.appointmentType
        });
        
        // Convert local datetime string to DayPilot Date (NO TIMEZONE CONVERSION)
        let appointmentStart;
        let appointmentEnd;
        
        try {
          // Normalize to strict ISO local string 'YYYY-MM-DDTHH:mm:ss'
          const raw = String(appointment.datetime || '');
          let isoLocal = raw.includes('T') ? raw.replace('Z', '') : raw.replace(' ', 'T');
          if (isoLocal.length === 16) {
            isoLocal = isoLocal + ':00';
          }
          // Validate minimal length 'YYYY-MM-DDTHH:mm:ss' = 19
          if (isoLocal.length < 19) {
            throw new Error(`Invalid datetime format: ${raw}`);
          }

          appointmentStart = new window.DayPilot.Date(isoLocal);
          appointmentEnd = new window.DayPilot.Date(isoLocal).addMinutes(appointment.duration);
        } catch (error) {
          console.warn('⚠️ Error parsing appointment datetime:', appointment.datetime, error);
          // Fallback to current time
          appointmentStart = window.DayPilot.Date.today();
          appointmentEnd = appointmentStart.addMinutes(appointment.duration || 60);
        }

        const event = {
          id: appointment.id,
          text: `${appointment.customerName}`,
          start: appointmentStart,
          end: appointmentEnd,
          data: appointment, // Store full appointment data for access
          // Event styling will be handled by onBeforeEventRender
          tags: {
            status: appointment.status,
            serviceType: appointment.appointmentType,
            duration: appointment.duration,
            priority: getDurationPriority(appointment.duration)
          }
        };
        
        console.log('🔄 Created DayPilot event:', {
          id: event.id,
          text: event.text,
          start: event.start.toString(),
          end: event.end.toString()
        });
        return event;
      });
      
      console.log('✅ All DayPilot events created:', dayPilotEvents);
      setEvents(dayPilotEvents);
    } else {
      console.log('⚠️ No appointment data or DayPilot not loaded:', {
        hasData: !!appointmentsData?.data,
        dataLength: appointmentsData?.data?.length || 0,
        hasDayPilot: !!window.DayPilot
      });
      setEvents([]);
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
    if (calendar && events.length >= 0) {
      calendar.events.list = events;
      calendar.update();
    }
  }, [events, calendar]);

  // 🎨 EVENT STYLING FUNCTIONS
  const getDurationPriority = (duration: number): 'short' | 'medium' | 'long' => {
    if (duration <= 30) return 'short';
    if (duration <= 90) return 'medium';
    return 'long';
  };

  const getStatusColorPalette = (status: string) => {
    const palettes = {
      confirmed: {
        bg: 'linear-gradient(135deg, #10b981 0%, #059669 25%, #047857 100%)',
        border: '#047857',
        bar: '#34d399',
        shadow: 'rgba(16, 185, 129, 0.3)'
      },
      pending: {
        bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 25%, #b45309 100%)',
        border: '#b45309',
        bar: '#fbbf24',
        shadow: 'rgba(245, 158, 11, 0.3)'
      },
      cancelled: {
        bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 25%, #b91c1c 100%)',
        border: '#b91c1c',
        bar: '#f87171',
        shadow: 'rgba(239, 68, 68, 0.3)'
      },
      completed: {
        bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 25%, #6d28d9 100%)',
        border: '#6d28d9',
        bar: '#a78bfa',
        shadow: 'rgba(139, 92, 246, 0.3)'
      }
    };
    return palettes[status as keyof typeof palettes] || {
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 25%, #1d4ed8 100%)',
      border: '#1d4ed8',
      bar: '#60a5fa',
      shadow: 'rgba(59, 130, 246, 0.3)'
    };
  };

  const getServiceIcon = (serviceType: string): string => {
    const icons = {
      'consultation': '💬',
      'checkup': '🔍', 
      'treatment': '⚕️',
      'therapy': '🧘',
      'surgery': '🏥',
      'emergency': '🚨'
    };
    
    // Try to match service type with keywords
    const lowerService = serviceType.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerService.includes(key)) return icon;
    }
    
    return '📅'; // Default icon
  };

  // initializeNavigator removed - no longer needed

  const initializeCalendar = () => {
    if (!window.DayPilot || !calendarRef.current) return;

    let calendarInstance;
    const commonConfig = {
      events: events,
      eventMoveHandling: "Update",
      eventResizeHandling: "Update",
      timeRangeSelectedHandling: "Enabled",
      eventClickHandling: "Enabled",
      contextMenu: new window.DayPilot.Menu([
        {
          text: "View Details",
          onClick: (args: any) => openAppointmentModal(args.source.data, 'view')
        },
        {
          text: "Edit Appointment", 
          onClick: (args: any) => openAppointmentModal(args.source.data, 'edit')
        },
        {
          text: "-"
        },
        {
          text: "Export to ICS",
          onClick: (args: any) => exportSingleEventToICS(args.source.data)
        },
        {
          text: "Delete",
          onClick: async (args: any) => {
            if (await window.DayPilot.Modal.confirm("Delete this appointment?")) {
              handleDeleteAppointment(args.source.data.id);
            }
          }
        }
      ]),
      
      // 🎨 SIMPLIFIED EVENT RENDERING FOR DEBUGGING
      onBeforeEventRender: (args: any) => {
        console.log('🎨 onBeforeEventRender called for event:', args.data);
        
        const appointment = args.data.data;
        const tags = args.data.tags;
        
        if (!appointment) {
          console.warn('⚠️ No appointment data in event:', args.data);
          return;
        }
        
        if (!tags) {
          console.warn('⚠️ No tags in event:', args.data);
          return;
        }
        
        console.log('🎨 Rendering event for:', appointment.customerName, 'Status:', tags.status);
        
        // Hide cancelled events completely
        if (tags.status === 'cancelled') {
          args.data.visible = false;
          return;
        }

        // SIMPLE RENDERING - no complex HTML for debugging
        const colorPalette = getStatusColorPalette(tags.status);
        args.data.backColor = colorPalette.bg;
        args.data.borderColor = colorPalette.border;
        args.data.barColor = colorPalette.bar;
        args.data.fontColor = "#ffffff";
        args.data.text = `${appointment.customerName} - ${tags.serviceType} (${tags.duration}min)`;
        args.data.toolTip = `${appointment.customerName} - ${tags.status} - ${String(appointment.datetime)}`;
        
        console.log('✅ Event rendered with simple styling');
      },
      
      onEventClick: (args: any) => {
        openAppointmentModal(args.e.data, 'view');
      },
      onTimeRangeSelected: (args: any) => {
        setSelectedSlot({ start: args.start, end: args.end });
        openAppointmentModal(null, 'create');
      },
      onEventMoved: async (args: any) => {
        console.log('🔄 Moving event:', args);
        console.log('🔄 Event data:', args.e.data);
        console.log('🔄 Event ID:', args.e.data?.id);
        console.log('🔄 New start:', args.newStart);
        console.log('🔄 New start toString:', args.newStart.toString());
        console.log('🔄 New start value type:', typeof args.newStart);
        console.log('🔄 New start constructor:', args.newStart.constructor.name);
        
        // DEBUGGING: Check if DayPilot is doing timezone conversion
        const originalValue = args.newStart.toString();
        console.log('🕐 DEBUGGING TIMEZONE CONVERSION:');
        console.log('🕐 Original DayPilot value:', originalValue);
        console.log('🕐 Current timezone offset:', new Date().getTimezoneOffset());
        
        try {
          // EXTRACT LOCAL DATETIME FROM DAYPILOT OBJECT (NO UTC CONVERSION!)
          const dayPilotDate = args.newStart;
          
          // Avoid calling DayPilot.Date internal methods that may not exist across builds
          console.log('🔄 DayPilot Date string:', dayPilotDate.toString());
          
          // BUILD LOCAL DATETIME STRING using DayPilot string formatter to strict format
          const newDateTime = dayPilotDate.toString('yyyy-MM-dd HH:mm');
          console.log('🔄 BUILT LOCAL DATETIME (DayPilot):', newDateTime);
          
          console.log('🔄 Final datetime being sent to backend:', newDateTime);
          
          // Check if new datetime is within current view range
          const currentStartStr = startDate?.firstDayOfMonth().toString('yyyy-MM-dd');
          const currentEndStr = startDate?.lastDayOfMonth().toString('yyyy-MM-dd');
          const newDateStr = newDateTime.split(' ')[0]; // Extract date part from "YYYY-MM-DD HH:mm"
          
          console.log('📅 Date range check:', {
            newEventDate: newDateStr,
            currentViewStart: currentStartStr,
            currentViewEnd: currentEndStr,
            isWithinRange: newDateStr >= currentStartStr && newDateStr <= currentEndStr
          });
          
          await handleUpdateAppointment(args.e.data.id, {
            datetime: newDateTime
          });

          // Optimistically update the event position to avoid visual revert
          try {
            const newStart = new window.DayPilot.Date(dayPilotDate.toString());
            const durationMinutes = args.e.data?.tags?.duration || args.e.data?.data?.duration || 60;
            const newEnd = newStart.addMinutes(durationMinutes);

            // Update event data and refresh in DayPilot
            args.e.data.start = newStart;
            args.e.data.end = newEnd;
            if (args.e.update) {
              args.e.update();
            } else if (args.control?.events?.update) {
              args.control.events.update(args.e);
            }
            console.log('✅ Event moved visually to:', newStart.toString(), '→', newEnd.toString());
          } catch (visualErr) {
            console.warn('⚠️ Could not update event visually:', visualErr);
          }

          console.log('✅ Event move successful');
        } catch (error) {
          console.error('❌ Event move failed:', error);
          // Revert the move by refreshing calendar
          if (calendar) {
            console.log('🔄 Reverting move by refreshing events');
            refetchAppointments();
          }
        }
      },
      onEventResized: async (args: any) => {
        console.log('Resizing event:', args);
        const newDuration = args.newEnd.getTime() - args.newStart.getTime();
        await handleUpdateAppointment(args.e.data.id, {
          duration: Math.round(newDuration / (1000 * 60))
        });
      }
    };

    if (view === 'Month') {
      calendarInstance = new window.DayPilot.Month(calendarRef.current, {
        ...commonConfig,
        viewType: "Month",
        startDate: startDate,
        cellHeight: 100,
        weekStarts: 1,
        headerHeight: 30,
        cellHeaderHeight: 25,
        showWeekend: true,
        // theme: "calendar_white" // Removed to prevent white-on-white text issues
      });
    } else if (view === 'Resources') {
      // Scheduler view for services
      calendarInstance = new window.DayPilot.Scheduler(calendarRef.current, {
        ...commonConfig,
        viewType: "Days",
        days: 7,
        startDate: startDate,
        scale: "Hour",
        timeHeaders: [
          { groupBy: "Day", format: "dddd M/d" },
          { groupBy: "Hour", format: "h tt" }
        ],
        resources: services.map(service => ({
          id: service.id,
          name: service.name,
          expanded: true,
          children: []
        })),
        cellHeight: 40,
        headerHeight: 30,
        eventHeight: 35
      });
    } else {
      calendarInstance = new window.DayPilot.Calendar(calendarRef.current, {
        ...commonConfig,
        viewType: view,
        startDate: startDate,
        cellHeight: 30,
        headerHeight: 30,
        hourWidth: 60,
        cellHeaderHeight: 25,
        // theme: "calendar_white" // Removed to prevent white-on-white text issues
      });
    }

    calendarInstance.init();
    setCalendar(calendarInstance);
  };

  const openAppointmentModal = (appointment: Appointment | null, mode: 'create' | 'edit' | 'view') => {
    setSelectedAppointment(appointment);
    setModalMode(mode);
    setShowAppointmentModal(true);
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      await createAppointment(() => appointmentsApi.create(appointmentData));
      refetchAppointments();
      setShowAppointmentModal(false);
      window.DayPilot.Modal.alert("Appointment created successfully!");
    } catch (error) {
      window.DayPilot.Modal.alert("Error creating appointment");
    }
  };

  const handleUpdateAppointment = async (id: string, updates: any) => {
    console.log('🔄 handleUpdateAppointment called:', { id, updates });
    
    try {
      const result = await updateAppointment(() => appointmentsApi.update(id, updates));
      console.log('✅ Update API call successful:', result);
      
      await refetchAppointments();
      console.log('✅ Appointments refetched after update');
      
      // Only show modal if it was called from the modal
      if (showAppointmentModal) {
        setShowAppointmentModal(false);
        window.DayPilot.Modal.alert("Appointment updated successfully!");
      }
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      
      // Only show modal if it was called from the modal  
      if (showAppointmentModal) {
        window.DayPilot.Modal.alert("Error updating appointment");
      }
      
      // Always refresh on error to revert changes
      refetchAppointments();
      throw error; // Re-throw to trigger error handling in onEventMove
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(() => appointmentsApi.cancel(id));
      refetchAppointments();
      setShowAppointmentModal(false);
      window.DayPilot.Modal.alert("Appointment deleted successfully!");
    } catch (error) {
      window.DayPilot.Modal.alert("Error deleting appointment");
    }
  };

  // Export functions
  const exportSingleEventToICS = (appointment: Appointment) => {
    const icsContent = generateICSContent([appointment]);
    downloadICS(icsContent, `appointment-${appointment.customerName}.ics`);
  };

  const exportAllToICS = () => {
    if (!appointmentsData?.data || !window.DayPilot) return;
    
    const icsContent = generateICSContent(appointmentsData.data);
    const filename = `calendar-export-${window.DayPilot.Date.today().toString('yyyy-MM-dd')}.ics`;
    downloadICS(icsContent, filename);
  };

  const generateICSContent = (appointments: Appointment[]) => {
    if (!window.DayPilot) return '';
    
      const icsEvents = appointments.map(appointment => {
        const localStr = String(appointment.datetime).replace(' ', 'T').replace('Z', '').slice(0, 16);
        const startDate = new window.DayPilot.Date(localStr);
        const endDate = startDate.addMinutes(appointment.duration);
        const startTime = startDate.toString('yyyyMMddTHHmmss') + 'Z';
        const endTime = endDate.toString('yyyyMMddTHHmmss') + 'Z';
      
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
PRODID:-//WhatsApp Bot//WhatsApp Bot Calendar Pro//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`;
  };

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
          <p className="text-gray-600">Loading DayPilot Calendar Pro...</p>
          <p className="text-sm text-gray-500 mt-2">Modal • DatePicker • Scheduler</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header with enhanced controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          
          {/* View selector with enhanced options */}
          <div className="flex flex-wrap gap-2">
            {(['Month', 'Week', 'Day', 'Resources'] as const).map((v) => (
              <Button
                key={v}
                onClick={() => setView(v)}
                variant={view === v ? 'primary' : 'secondary'}
                className="text-sm px-3 py-2"
              >
                {v === 'Resources' ? '📊 Services' : v}
              </Button>
            ))}
          </div>
          
          {/* Enhanced toolbar */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => openAppointmentModal(null, 'create')}
              variant="primary"
              className="flex items-center space-x-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </Button>
            
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
        </div>

        {/* Enhanced navigation */}
        <div className="flex justify-between items-center mt-4">
          <Button onClick={navigatePrevious} variant="secondary" className="px-3 py-1">
            ←
          </Button>
          
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {view === 'Month' ? startDate.toString('MMMM yyyy') : 
               view === 'Week' ? `Week of ${startDate.toString('MMM dd, yyyy')}` :
               view === 'Resources' ? `Services - ${startDate.toString('MMM dd, yyyy')}` :
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

      {/* Main calendar area - full width */}
      <div className="p-4">
        <div 
          ref={calendarRef}
          className="daypilot-calendar-container" 
          style={{ minHeight: '600px' }}
        />
      </div>

      {/* Enhanced appointment modal would go here */}
      {showAppointmentModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          mode={modalMode}
          services={services}
          selectedSlot={selectedSlot}
          onSave={modalMode === 'create' ? handleCreateAppointment : (data: any) => handleUpdateAppointment(selectedAppointment?.id || '', data)}
          onDelete={handleDeleteAppointment}
          onClose={() => setShowAppointmentModal(false)}
          isLoading={isCreating || isUpdating || isDeleting}
        />
      )}
    </div>
  );
};

// Enhanced Appointment Modal Component
const AppointmentModal: React.FC<{
  appointment: Appointment | null;
  mode: 'create' | 'edit' | 'view';
  services: Service[];
  selectedSlot: {start: any, end: any} | null;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ appointment, mode, services, selectedSlot, onSave, onDelete, onClose, isLoading }) => {
  
  console.log('🔍 AppointmentModal: Received services:', services);
  console.log('🔍 AppointmentModal: Services count:', services?.length || 0);
  
  // Safe datetime conversion (NO TIMEZONE CONVERSION - ONLY STRINGS!)
  const getSafeDateTime = (appointment: Appointment | null, selectedSlot: {start: any, end: any} | null): string => {
    if (appointment?.datetime) {
      try {
        const datetimeStr = appointment.datetime.toString();
        
        if (datetimeStr.includes('T')) {
          // ISO format: "2025-08-12T11:00:00.000Z" or "2025-08-12T11:00:00"
          return datetimeStr.replace('Z', '').slice(0, 16);
        } else {
          // Local format: "2025-08-12 11:00" -> "2025-08-12T11:00"
          return datetimeStr.replace(' ', 'T').slice(0, 16);
        }
      } catch (error) {
        console.warn('⚠️ Invalid appointment datetime:', appointment.datetime, error);
      }
    }
    
    if (selectedSlot?.start) {
      try {
        // EXTRACT LOCAL TIME FROM DAYPILOT DATE OBJECT (NO toString!)
        const dayPilotDate = selectedSlot.start;
        const year = dayPilotDate.getYear();
        const month = String(dayPilotDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayPilotDate.getDate()).padStart(2, '0');
        const hour = String(dayPilotDate.getHours()).padStart(2, '0');
        const minute = String(dayPilotDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}`;
      } catch (error) {
        console.warn('⚠️ Invalid selectedSlot start:', selectedSlot.start, error);
      }
    }
    
    // Fallback to current local time (NO TIMEZONE CONVERSION)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const [formData, setFormData] = useState({
    customerName: appointment?.customerName || '',
    customerPhone: appointment?.customerPhone || '',
    customerEmail: appointment?.customerEmail || '',
    datetime: getSafeDateTime(appointment, selectedSlot),
    duration: appointment?.duration || 60,
    notes: appointment?.notes || '',
    serviceId: appointment?.appointmentType || (services && services.length > 0 ? services[0].id : ''),
    status: appointment?.status || 'confirmed'
  });

  // Update serviceId when services are loaded
  React.useEffect(() => {
    if (services && services.length > 0 && !formData.serviceId) {
      console.log('🔄 AppointmentModal: Setting default service:', services[0]);
      setFormData(prev => ({ 
        ...prev, 
        serviceId: services[0].id,
        duration: services[0].durationMinutes || 60
      }));
    }
  }, [services, formData.serviceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // NO TIMEZONE CONVERSION - use datetime as-is
    const appointmentData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      datetime: formData.datetime, // Send as simple datetime string without timezone
      duration: formData.duration,
      notes: formData.notes,
      appointmentType: formData.serviceId,
      status: formData.status
    };

    console.log('🕐 NO Timezone Conversion:', {
      originalInput: formData.datetime,
      sentToBackend: appointmentData.datetime,
      message: 'Using datetime as-is without timezone conversion'
    });

    if (mode === 'create') {
      onSave(appointmentData);
    } else if (mode === 'edit' && appointment) {
      onSave(appointmentData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              {mode === 'create' && <><PlusIcon className="h-5 w-5 mr-2" />Create Appointment</>}
              {mode === 'edit' && <><PencilIcon className="h-5 w-5 mr-2" />Edit Appointment</>}
              {mode === 'view' && <><EyeIcon className="h-5 w-5 mr-2" />View Appointment</>}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {mode === 'view' ? (
            // View mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <div className="flex items-center text-gray-900">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {appointment?.customerName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {appointment?.customerPhone}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{appointment?.customerEmail}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <div className="flex items-center text-gray-900">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {appointment && new Date(appointment.datetime).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{appointment?.duration} minutes</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <p className="text-gray-900">{appointment?.appointmentType}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  appointment?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  appointment?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment?.status}
                </span>
              </div>
              
              {appointment?.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => onDelete(appointment?.id || '')}
                  variant="secondary"
                  className="text-red-600 hover:text-red-700"
                  disabled={isLoading}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            // Create/Edit form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                />
                <Input
                  label="Phone"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date & Time"
                  type="datetime-local"
                  required
                  value={formData.datetime}
                  onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                />
                <Input
                  label="Duration (minutes)"
                  type="number"
                  required
                  min="15"
                  max="480"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Select
                  label="Service"
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  options={services.length > 0 ? services.map(service => ({
                    value: service.id,
                    label: `${service.name} - $${service.price} (${service.durationMinutes}min)`
                  })) : [
                    { value: '', label: 'No services available - Configure services in Bot Settings first' }
                  ]}
                />
                {services.length === 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <p className="font-medium">⚠️ No Services Configured</p>
                    <p>Go to Bot Configuration → Services & Prices to add services first.</p>
                  </div>
                )}
              </div>

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'confirmed' | 'cancelled' | 'completed' }))}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" }
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button onClick={onClose} variant="secondary" type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPro;
