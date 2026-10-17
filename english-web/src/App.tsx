import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout.tsx';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Home from './pages/Home.tsx';
import Tutor from './pages/Tutor.tsx';
import Progress from './pages/Progress.tsx';
import Review from './pages/Review.tsx';
import Missions from './pages/Missions.tsx';
import MissionRun from './pages/MissionRun.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/review" element={<Review />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/run/:runId" element={<MissionRun />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
