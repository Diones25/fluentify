import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout.tsx';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding.tsx';
import Home from './pages/Home.tsx';
import Tutor from './pages/Tutor.tsx';
import Progress from './pages/Progress.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
