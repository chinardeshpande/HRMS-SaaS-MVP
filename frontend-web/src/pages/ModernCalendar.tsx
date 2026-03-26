import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import calendarService, { CalendarEvent } from '../services/calendarService';
import {
  CalendarDaysIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ModernCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    eventType: 'meeting',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    location: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, selectedEventType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (selectedEventType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.eventType === selectedEventType));
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.startDate === dateStr);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const handleOpenAddModal = (date?: Date) => {
    const selectedDateStr = date
      ? date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setFormData({
      title: '',
      description: '',
      eventType: 'meeting',
      startDate: selectedDateStr,
      endDate: selectedDateStr,
      startTime: '',
      endTime: '',
      isAllDay: false,
      location: '',
      status: 'scheduled',
    });
    setSelectedEvent(null);
    setIsEditMode(false);
    setShowEventModal(true);
  };

  const handleOpenEditModal = (event: CalendarEvent) => {
    setFormData(event);
    setSelectedEvent(event);
    setIsEditMode(true);
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setIsEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && selectedEvent) {
        await calendarService.updateEvent(selectedEvent.eventId, formData);
      } else {
        await calendarService.createEvent(formData);
      }
      await fetchEvents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await calendarService.deleteEvent(eventId);
      await fetchEvents();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      joining: 'bg-green-100 text-green-800 border-green-200',
      performance_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hr_event: 'bg-blue-100 text-blue-800 border-blue-200',
      training: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      interview: 'bg-purple-100 text-purple-800 border-purple-200',
      exit_meeting: 'bg-red-100 text-red-800 border-red-200',
      holiday: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      meeting: 'bg-gray-100 text-gray-800 border-gray-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[type] || colorMap.other;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'joining', label: 'Joinings' },
    { value: 'performance_review', label: 'Performance Reviews' },
    { value: 'hr_event', label: 'HR Events' },
    { value: 'training', label: 'Training' },
    { value: 'interview', label: 'Interviews' },
    { value: 'exit_meeting', label: 'Exit Meetings' },
    { value: 'holiday', label: 'Holidays' },
    { value: 'meeting', label: 'Meetings' },
  ];

  return (
    <ModernLayout title="Calendar">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HR Calendar</h1>
                <p className="text-sm text-gray-500">Manage all HR events and schedules</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddModal()}
                className="btn btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Event
              </button>
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary flex items-center gap-2"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button onClick={handlePreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">{monthName}</h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button onClick={handleToday} className="btn btn-sm btn-secondary ml-2">
                Today
              </button>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="input input-sm"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isSameMonth(date) ? 'bg-gray-50' : 'bg-white'
                  } ${isToday(date) ? 'bg-blue-50' : ''}`}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            isToday(date)
                              ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                              : !isSameMonth(date)
                              ? 'text-gray-400'
                              : 'text-gray-900'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        <button
                          onClick={() => handleOpenAddModal(date)}
                          className="opacity-0 hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                        >
                          <PlusIcon className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.eventId}
                            onClick={() => handleOpenEditModal(event)}
                            className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getEventBadgeColor(event.eventType)}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.startTime && !event.isAllDay && (
                              <div className="text-xs opacity-75">{event.startTime}</div>
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />

            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edit Event' : 'Add New Event'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="input w-full"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="input w-full"
                      placeholder="Event description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Type *
                      </label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        required
                        className="input w-full"
                      >
                        <option value="joining">Joining</option>
                        <option value="performance_review">Performance Review</option>
                        <option value="hr_event">HR Event</option>
                        <option value="training">Training</option>
                        <option value="interview">Interview</option>
                        <option value="exit_meeting">Exit Meeting</option>
                        <option value="holiday">Holiday</option>
                        <option value="meeting">Meeting</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="input w-full"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAllDay"
                      checked={formData.isAllDay}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">All-day event</label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  {!formData.isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="input w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="input w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="Event location"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  {isEditMode && selectedEvent && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedEvent.eventId)}
                      className="btn btn-danger"
                    >
                      Delete Event
                    </button>
                  )}
                  <div className={`flex items-center gap-3 ${!isEditMode ? 'w-full' : 'ml-auto'}`}>
                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary flex-1">
                      {isEditMode ? 'Update Event' : 'Create Event'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );

  function handleExportCSV() {
    const headers = ['Title', 'Type', 'Start Date', 'End Date', 'Location', 'Status'];
    const rows = events.map(event => [
      event.title,
      event.eventType,
      event.startDate,
      event.endDate || '-',
      event.location || '-',
      event.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar_events_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
