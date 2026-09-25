import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { LoginPage } from '../pages/login/LoginPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<PlaceholderPage title="Dashboard" />} />
          <Route path="rooms" element={<PlaceholderPage title="Room Directory" />} />
          <Route path="rooms/:id" element={<PlaceholderPage title="Room Details" />} />
          <Route path="create-booking" element={<PlaceholderPage title="Create Booking" />} />
          <Route path="bookings" element={<PlaceholderPage title="My Bookings" />} />
          <Route path="bookings/:id" element={<PlaceholderPage title="Booking Details" />} />
          <Route element={<AdminRoute />}>
            <Route path="admin/rooms" element={<PlaceholderPage title="Admin Rooms" />} />
            <Route path="admin/calendar" element={<PlaceholderPage title="Admin Calendar" />} />
            <Route path="admin/analytics" element={<PlaceholderPage title="Analytics" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
