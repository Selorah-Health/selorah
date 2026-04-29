import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
