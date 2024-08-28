// src/components/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from '../supabaseClient'; // Make sure to import supabase client
import { generate } from 'random-words'; // Make sure to install and import random-words package
import { toast } from "sonner";

const Home = () => {
  const [scheduleName, setScheduleName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [icon, setIcon] = useState('📅'); // Default icon
  const navigate = useNavigate();

  const generateUniqueId = async () => {
    let isUnique = false;
    let id;
    while (!isUnique) {
      id = generate({ exactly: 3, join: '-' });
      const { data, error } = await supabase
        .from('schedules')
        .select('id')
        .eq('id', id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        isUnique = true;
      }
    }
    return id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = await generateUniqueId();
      const { data, error } = await supabase
        .from('schedules')
        .insert([
          { id, title: scheduleName, icon }
        ]);
      
      if (error) throw error;
      
      navigate(`/schedule/${id}?start=${startTime}&end=${endTime}`);
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule. Please try again.');
    }
  };

  return (
    <div className="pt-10">
        <div className="container mx-auto p-6 bg-background rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Appointment Scheduler</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="scheduleName">Schedule Name</Label>
              <Input
                id="scheduleName"
                type="text"
                placeholder="Enter schedule name"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                type="text"
                placeholder="Enter icon (emoji or text)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Create Schedule</Button>
          </form>
        </div>
    </div>
  );
};

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      options.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

export default Home;