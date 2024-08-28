import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "./components/ui/sonner"
import Home from './components/Home';
import Schedule from './components/Schedule';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schedule/:scheduleId" element={<Schedule />} />
          </Routes>
          <Toaster />
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;