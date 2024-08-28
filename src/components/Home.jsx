import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from '../supabaseClient';
import { generate } from 'random-words';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { X } from 'lucide-react';

const Home = () => {
  const [scheduleName, setScheduleName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [icon, setIcon] = useState('📅'); // Default icon
  const [mySchedules, setMySchedules] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scheduleSlug, setScheduleSlug] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedSchedules = JSON.parse(localStorage.getItem('mySchedules') || '[]');
    setMySchedules(savedSchedules);
  }, []);

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
      
      const newSchedule = { id, title: scheduleName, icon };
      const updatedSchedules = [...mySchedules, newSchedule];
      setMySchedules(updatedSchedules);
      localStorage.setItem('mySchedules', JSON.stringify(updatedSchedules));
      
      navigate(`/schedule/${id}?start=${startTime}&end=${endTime}`);
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule. Please try again.');
    }
  };

  const handleAddExistingSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleSlug)
        .single();

      if (error) throw error;

      const newSchedule = { id: data.id, title: data.title, icon: data.icon };
      const updatedSchedules = [...mySchedules, newSchedule];
      setMySchedules(updatedSchedules);
      localStorage.setItem('mySchedules', JSON.stringify(updatedSchedules));
      setIsDialogOpen(false);
      setScheduleSlug('');
      toast.success('Schedule added successfully');
    } catch (error) {
      console.error('Error adding existing schedule:', error);
      toast.error('Failed to add schedule. Please check the slug and try again.');
    }
  };

  const handleRemoveSchedule = (id) => {
    const updatedSchedules = mySchedules.filter(schedule => schedule.id !== id);
    setMySchedules(updatedSchedules);
    localStorage.setItem('mySchedules', JSON.stringify(updatedSchedules));
    toast.success('Schedule removed successfully');
  };

  return (
    <div className="pt-10 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-4 text-foreground">schedule-it — Appointment Scheduler</h1>
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
        <div className="mt-12 mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold mb-4">My Schedules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySchedules.map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="relative p-6 border rounded-lg shadow-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => navigate(`/schedule/${schedule.id}`)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{schedule.icon}</span>
                    <span className="font-semibold">{schedule.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 p-2 hover:bg-accent-foreground hover:text-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSchedule(schedule.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">Add Existing Schedule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Existing Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label htmlFor="scheduleSlug">Schedule Slug</Label>
                  <Input
                    id="scheduleSlug"
                    type="text"
                    placeholder="Enter schedule slug"
                    value={scheduleSlug}
                    onChange={(e) => setScheduleSlug(e.target.value)}
                  />
                  <Button onClick={handleAddExistingSchedule}>Add Schedule</Button>
                </div>
              </DialogContent>
            </Dialog>
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