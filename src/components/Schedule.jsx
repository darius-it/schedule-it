// src/components/Schedule.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { format, parseISO, addMinutes, isWithinInterval, setHours, setMinutes, differenceInMinutes, isBefore, isEqual } from 'date-fns';
import { supabase } from '../supabaseClient';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

const Schedule = () => {
  const { scheduleId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const startTime = searchParams.get('start');
  const endTime = searchParams.get('end');

  const [schedule, setSchedule] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedTime, setSelectedTime] = useState('');

  const [appointmentColors, setAppointmentColors] = useState({});

  useEffect(() => {
    if (scheduleId) {
      fetchSchedule();
      fetchAppointments();
    }
  }, [scheduleId]);

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
      current = addMinutes(current, 15);
    }

    return slots;
  };

  const isAppointmentInSlot = (appointment, slotTime) => {
    const aptStart = parseISO(appointment.start_time);
    const aptEnd = parseISO(appointment.end_time);
    const slotStart = setMinutes(setHours(new Date(), parseInt(slotTime.split(':')[0])), parseInt(slotTime.split(':')[1]));
    const slotEnd = addMinutes(slotStart, 15);
    
    return isWithinInterval(slotStart, { start: aptStart, end: aptEnd }) ||
           isWithinInterval(slotEnd, { start: aptStart, end: aptEnd }) ||
           (isBefore(slotStart, aptStart) && isWithinInterval(aptStart, { start: slotStart, end: slotEnd }));
  };

  const getAppointmentStyle = (appointment, slotTime) => {
    const aptStart = parseISO(appointment.start_time);
    const aptEnd = parseISO(appointment.end_time);
    const slotStart = setMinutes(setHours(new Date(), parseInt(slotTime.split(':')[0])), parseInt(slotTime.split(':')[1]));

    const startOffset = Math.max(0, differenceInMinutes(aptStart, slotStart));
    const endOffset = Math.min(15, differenceInMinutes(aptEnd, slotStart));
    const height = endOffset - startOffset;

    return {
      position: 'absolute',
      top: `${(startOffset / 15) * 100}%`,
      height: `${(height / 15) * 100}%`,
      left: '64px',
      right: '0',
      backgroundColor: appointmentColors[appointment.id] || generateContrastColor(),
    };
  };

  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => parseISO(a.start_time) - parseISO(b.start_time));
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
    <div className="container mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        {schedule.icon} {schedule.title}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="time-grid bg-muted p-4 rounded-md">
            {generateTimeSlots().map(slot => (
                <div key={slot} className="time-slot flex items-center h-14 relative">
                    <span className="w-20 text-sm self-start text-muted-foreground">{slot}</span>
                    <div className="absolute left-20 right-0 top-0 bottom-0 border-b border-border"></div>
                    {sortAppointments(appointments).map(apt => {
                        if (isAppointmentInSlot(apt, slot)) {
                            const style = getAppointmentStyle(apt, slot);
                            const isFirstSlot = format(parseISO(apt.start_time), 'HH:mm') === slot;
                            return (
                            <div 
                                key={apt.id} 
                                className="appointment text-primary-foreground text-sm overflow-hidden z-10"
                                style={style}
                            >
                                {isFirstSlot && (
                                  <div className="p-2">
                                    <div className="font-semibold">{apt.name}</div>
                                    <div className="text-xs">{format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}</div>
                                  </div>
                                )}
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
              <Label htmlFor="name">Your Name</Label>
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
    </div>
  );
};

const generateContrastColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
  const lightness = 45 + Math.floor(Math.random() * 10); // 45-55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default Schedule;