import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import AppShell from './components/Layout/AppShell';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Calendar from './pages/Calendar';
import './styles/index.css';
import './styles/animations.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:id" element={<GoalDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/calendar" element={<Calendar />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
