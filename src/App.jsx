import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "./components/ui/sonner"
import Home from './components/Home';
import Schedule from './components/Schedule';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule/:scheduleId" element={<Schedule />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;