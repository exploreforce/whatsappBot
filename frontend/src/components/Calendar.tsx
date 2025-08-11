'use client';

import React, { useState } from 'react';
import { useFetch, useApi } from '@/hooks/useApi';
import { calendarApi, appointmentsApi } from '@/utils/api';
import moment from 'moment';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import Alert from '@/components/ui/Alert';
import CalendarView from './calendar/CalendarView';
import { 
  CalendarIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

const weekDays = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },  
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' }
];

const AvailabilitySettings = () => {
  const { execute: updateAvailability, isLoading: isUpdating } = useApi();
  
  const [schedule, setSchedule] = useState<{ [key: string]: DaySchedule }>({
    monday: { isAvailable: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { isAvailable: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { isAvailable: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    thursday: { isAvailable: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    friday: { isAvailable: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    saturday: { isAvailable: false, timeSlots: [] },
    sunday: { isAvailable: false, timeSlots: [] }
  });

  const [blackoutDates, setBlackoutDates] = useState<Array<{ date: string; reason: string }>>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateDayAvailability = (day: string, isAvailable: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable,
        timeSlots: isAvailable ? prev[day].timeSlots : []
      }
    }));
  };

  const addTimeSlot = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { start: '09:00', end: '17:00' }]
      }
    }));
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const addBlackoutDate = () => {
    setBlackoutDates(prev => [...prev, { date: moment().format('YYYY-MM-DD'), reason: '' }]);
  };

  const updateBlackoutDate = (index: number, field: 'date' | 'reason', value: string) => {
    setBlackoutDates(prev => prev.map((bd, i) => 
      i === index ? { ...bd, [field]: value } : bd
    ));
  };

  const removeBlackoutDate = (index: number) => {
    setBlackoutDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateAvailability(() => calendarApi.updateAvailability({
        weeklySchedule: schedule,
        blackoutDates: blackoutDates.map(bd => ({
          date: bd.date,
          reason: bd.reason,
          isRecurring: false
        }))
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save availability:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Lade Verfügbarkeiten...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert type="success" message="Verfügbarkeiten erfolgreich gespeichert!" />
      )}

      

      {/* Weekly Schedule */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Wöchentliche Verfügbarkeit</h3>
          </div>
          
          <div className="space-y-4">
            {weekDays.map(({ key, label }) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{label}</span>
                  <Switch
                    checked={schedule[key]?.isAvailable || false}
                    onCheckedChange={(checked) => updateDayAvailability(key, checked)}
                  />
                </div>
                
                {schedule[key]?.isAvailable && (
                  <div className="space-y-2">
                    {schedule[key].timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(key, index, 'start', e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-gray-500">bis</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(key, index, 'end', e.target.value)}
                          className="flex-1"
                        />
                        {schedule[key].timeSlots.length > 1 && (
                          <Button
                            onClick={() => removeTimeSlot(key, index)}
                            variant="secondary"
                            className="p-2"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      onClick={() => addTimeSlot(key)}
                      variant="secondary"
                      className="flex items-center space-x-1 text-sm"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Zeitfenster hinzufügen</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Blackout Dates */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gesperrte Termine</h3>
            </div>
            <Button
              onClick={addBlackoutDate}
              className="flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Datum hinzufügen</span>
            </Button>
          </div>
          
          <div className="space-y-3">
            {blackoutDates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine gesperrten Termine</p>
            ) : (
              blackoutDates.map((blackout, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Input
                    type="date"
                    value={blackout.date}
                    onChange={(e) => updateBlackoutDate(index, 'date', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Grund (optional)"
                    value={blackout.reason}
                    onChange={(e) => updateBlackoutDate(index, 'reason', e.target.value)}
                    className="flex-2"
                  />
                  <Button
                    onClick={() => removeBlackoutDate(index)}
                    variant="secondary"
                    className="p-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="min-w-[200px]"
        >
          {isUpdating ? 'Speichere...' : 'Verfügbarkeiten speichern'}
        </Button>
      </div>
    </div>
  );
};

const Calendar = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability'>('calendar');
  const [dateRange, setDateRange] = React.useState({
    startDate: moment().startOf('month').format('YYYY-MM-DD'),
    endDate: moment().endOf('month').format('YYYY-MM-DD'),
  });

  const { data: overviewData, isLoading: isLoadingOverview, error: overviewError, refetch: refetchOverview } = useFetch(
    () => calendarApi.getOverview({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    [dateRange]
  );

  const { data: appointmentsData, isLoading: isLoadingAppointments, error: appointmentsError, refetch: refetchAppointments } = useFetch(
    () => appointmentsApi.getAll({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    [dateRange]
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formattedEvents = (appointmentsData?.data || []).map((appt: any) => ({
    id: appt.id,
    title: `${appt.customerName || appt.customer_name} - ${appt.appointmentType || 'Termin'}`,
    start: new Date(appt.datetime),
    end: new Date(new Date(appt.datetime).getTime() + appt.duration * 60000), // NO TIMEZONE CONVERSION
    resource: appt
  }));

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Kalender</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'availability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Verfügbarkeiten</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'calendar' ? (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Kalender</h2>
            <div className="flex items-center space-x-4 mb-4">
              <Input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="border-gray-300 rounded-md shadow-sm"
              />
              <Input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="border-gray-300 rounded-md shadow-sm"
              />
              <Button onClick={() => refetchOverview()} disabled={isLoadingOverview}>
                {isLoadingOverview ? 'Laden...' : 'Aktualisieren'}
              </Button>
            </div>
            {(isLoadingOverview || isLoadingAppointments) && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Lade Daten...</span>
              </div>
            )}
            {(overviewError || appointmentsError) && (
              <Alert type="error" message={overviewError || appointmentsError || 'Fehler beim Laden der Daten'} />
            )}
            {overviewData && overviewData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Termine gesamt</h3>
                  <p className="text-3xl font-bold text-blue-900">{overviewData.data.totalAppointments}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Verfügbare Slots</h3>
                  <p className="text-3xl font-bold text-green-900">{overviewData.data.availableSlots}</p>
                </div>
                <div className="p-4 bg-red-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800">Belegte Slots</h3>
                  <p className="text-3xl font-bold text-red-900">{overviewData.data.busySlots}</p>
                </div>
              </div>
            )}
            <CalendarView 
              events={formattedEvents} 
              onEventsChange={() => {
                refetchOverview();
                refetchAppointments();
              }} 
            />
          </div>
        </Card>
      ) : (
        <AvailabilitySettings />
      )}
    </div>
  );
};

export default Calendar; 