// src/components/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const Home = () => {
  const [scheduleName, setScheduleName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/schedule/${scheduleName}?start=${startTime}&end=${endTime}`);
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