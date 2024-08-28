import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, addMinutes, isWithinInterval, setHours, setMinutes, differenceInMinutes, isBefore, isEqual } from 'date-fns';
import { supabase } from '../supabaseClient';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

const Schedule = () => {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [startTime, setStartTime] = useState(searchParams.get('start') || '09:00');
  const [endTime, setEndTime] = useState(searchParams.get('end') || '17:00');
  const [granularity, setGranularity] = useState(() => {
    const savedGranularity = localStorage.getItem(`granularity_${scheduleId}`);
    return savedGranularity ? parseInt(savedGranularity) : 15;
  });

  const [schedule, setSchedule] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedTime, setSelectedTime] = useState('');

  const [appointmentColors, setAppointmentColors] = useState({});
  const [isTimeWindowDialogOpen, setIsTimeWindowDialogOpen] = useState(false);
  const [isGranularityDialogOpen, setIsGranularityDialogOpen] = useState(false);

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
      fetchAppointments();
    }
  }, [scheduleId]);

  useEffect(() => {
    if (scheduleId) {
      localStorage.setItem(`granularity_${scheduleId}`, granularity.toString());
    }
  }, [scheduleId, granularity]);

  const generateAppointmentColors = (appointments) => {
    const newColors = {};
    appointments.forEach(apt => {
      if (!appointmentColors[apt.id]) {
        newColors[apt.id] = generateContrastColor();
      } else {
        newColors[apt.id] = appointmentColors[apt.id];
      }
    });
    setAppointmentColors(newColors);
  };

  const fetchSchedule = async () => {
    if (!scheduleId) return;

    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error) throw error;

      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      if (error.code === 'PGRST116') {
        // Handle the case where no schedule is found
        setSchedule(null);
      }
    }
  };

  const fetchAppointments = async () => {
    if (!scheduleId) return;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('schedule', scheduleId);
  
    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      console.log('Fetched appointments:', data);
      setAppointments(data || []);
      generateAppointmentColors(data || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime) {
      toast.error('Please select a start time for the appointment.');
      return;
    }
    const startDateTime = parseISO(`${format(new Date(), 'yyyy-MM-dd')}T${selectedTime}`);
    const endDateTime = addMinutes(startDateTime, duration);
  
    // Check for overlapping appointments
    const isOverlapping = appointments.some(apt => {
      const aptStart = parseISO(apt.start_time);
      const aptEnd = parseISO(apt.end_time);
      return (
        (isWithinInterval(startDateTime, { start: aptStart, end: aptEnd }) && !isEqual(startDateTime, aptEnd)) ||
        (isWithinInterval(endDateTime, { start: aptStart, end: aptEnd }) && !isEqual(endDateTime, aptStart)) ||
        (isBefore(startDateTime, aptStart) && isWithinInterval(aptStart, { start: startDateTime, end: endDateTime }))
      );
    });
  
    if (isOverlapping) {
      toast.error('This time slot overlaps with an existing appointment.');
      return;
    }
  
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          schedule: scheduleId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          name: name,
        },
      ]);
  
    if (error) console.error('Error creating appointment:', error);
    else {
      toast.success('Appointment scheduled successfully!');
      await fetchAppointments();
      setName('');
      setSelectedTime('');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    let current = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);

    while (current < end) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, granularity);
    }

    return slots;
  };

  const isAppointmentInSlot = (appointment, slotTime) => {
    const aptStart = parseISO(appointment.start_time);
    const aptEnd = parseISO(appointment.end_time);
    const slotStart = setMinutes(setHours(new Date(), parseInt(slotTime.split(':')[0])), parseInt(slotTime.split(':')[1]));
    const slotEnd = addMinutes(slotStart, granularity);
    
    return isWithinInterval(slotStart, { start: aptStart, end: aptEnd }) ||
           isWithinInterval(slotEnd, { start: aptStart, end: aptEnd }) ||
           (isBefore(slotStart, aptStart) && isWithinInterval(aptStart, { start: slotStart, end: slotEnd }));
  };

  const getAppointmentStyle = (appointment, slotTime) => {
    const aptStart = parseISO(appointment.start_time);
    const aptEnd = parseISO(appointment.end_time);
    const slotStart = setMinutes(setHours(new Date(), parseInt(slotTime.split(':')[0])), parseInt(slotTime.split(':')[1]));

    const startOffset = Math.max(0, differenceInMinutes(aptStart, slotStart));
    const endOffset = Math.min(granularity, differenceInMinutes(aptEnd, slotStart));
    const height = endOffset - startOffset;

    return {
      position: 'absolute',
      top: `${(startOffset / granularity) * 100}%`,
      height: `${(height / granularity) * 100}%`,
      left: '64px',
      right: '0',
      backgroundColor: appointmentColors[appointment.id] || generateContrastColor(),
    };
  };

  const handleTimeWindowChange = (newStart, newEnd) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    setIsTimeWindowDialogOpen(false);
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('start', newStart);
    newSearchParams.set('end', newEnd);
    window.history.replaceState({}, '', `${location.pathname}?${newSearchParams}`);
  };

  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));
  };

  const handleGranularityChange = (newGranularity) => {
    setGranularity(parseInt(newGranularity));
    setIsGranularityDialogOpen(false);
  };

  const handleDeleteAllAppointments = async () => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('schedule', scheduleId);

    if (error) {
      console.error('Error deleting appointments:', error);
      toast.error('Failed to delete appointments. Please try again.');
    } else {
      toast.success('All appointments have been deleted successfully!');
      setAppointments([]);
      setAppointmentColors({});
    }
  };

  if (!schedule) return <div>Loading...</div>;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="ml-6 mt-4"
      >
        Go Back Home
      </Button>
      <div className="container mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {schedule.icon} {schedule.title}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsTimeWindowDialogOpen(true)}>
                Change displayed time window
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsGranularityDialogOpen(true)}>
                Change timeline granularity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="time-grid bg-muted p-4 rounded-md">
              {generateTimeSlots().map(slot => (
                  <div key={slot} className="time-slot flex items-center h-14 relative">
                      <span className="w-20 text-sm self-start text-muted-foreground">{slot}</span>
                      <div className="absolute left-20 right-0 top-0 bottom-0 border-b border-border"></div>
                      {sortAppointments(appointments).map(apt => {
                          if (isAppointmentInSlot(apt, slot)) {
                              const style = getAppointmentStyle(apt, slot);
                              return (
                                  <div 
                                      key={apt.id} 
                                      className="appointment text-primary-foreground text-sm overflow-visible z-10"
                                      style={style}
                                  >
                                      <div className="p-2">
                                          <div className="font-semibold truncate">{apt.name}</div>
                                          <div className="text-xs">{format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}</div>
                                      </div>
                                  </div>
                              );
                          }
                          return null;
                      })}
                  </div>
              ))}
          </div>
          <div className="appointment-form">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter a name for the appointment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 20, 30, 45, 60].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Schedule Appointment</Button>
            </form>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleDeleteAllAppointments} variant="destructive">Delete All Appointments</Button>
        </div>

        <Dialog open={isTimeWindowDialogOpen} onOpenChange={setIsTimeWindowDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Displayed Time Window</DialogTitle>
              <DialogDescription>
                Select the start and end times for the displayed time window.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Start Time
                </Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  End Time
                </Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleTimeWindowChange(startTime, endTime)}>Apply Changes</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={isGranularityDialogOpen} onOpenChange={setIsGranularityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Timeline Granularity</DialogTitle>
              <DialogDescription>
                Select the granularity (in minutes) for the timeline.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="granularity" className="text-right">
                  Granularity
                </Label>
                <Select value={granularity.toString()} onValueChange={handleGranularityChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select granularity" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 30, 60].map(g => (
                      <SelectItem key={g} value={g.toString()}>
                        {g} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

const generateContrastColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
  const lightness = 45 + Math.floor(Math.random() * 10); // 45-55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default Schedule;
