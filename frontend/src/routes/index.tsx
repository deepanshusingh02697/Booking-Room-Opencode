import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/login/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { RoomDirectoryPage } from '../pages/room-directory/RoomDirectoryPage';
import { RoomDetailsPage } from '../pages/room-details/RoomDetailsPage';
import { AdminRoomsPage } from '../pages/admin-rooms/AdminRoomsPage';
import { AdminCalendarPage } from '../pages/admin-calendar/AdminCalendarPage';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { EquipmentPage } from '../pages/equipment/EquipmentPage';
import { CreateBookingPage } from '../pages/create-booking/CreateBookingPage';
import { MyBookingsPage } from '../pages/my-bookings/MyBookingsPage';
import { MyMeetingsPage } from '../pages/my-meetings/MyMeetingsPage';
import { WaitlistPage } from '../pages/wait-list/WaitlistPage';
import { BookingDetailsPage } from '../pages/booking-details/BookingDetailsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="rooms"
            element={<RoomDirectoryPage />}
          />
          <Route path="rooms/:id" element={<RoomDetailsPage />} />
          <Route
            path="create-booking"
            element={<CreateBookingPage />}
          />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailsPage />} />
          <Route path="wait-list" element={<WaitlistPage />} />
          <Route path="meetings" element={<MyMeetingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin/rooms" element={<AdminRoomsPage />} />
            <Route path="admin/calendar" element={<AdminCalendarPage />} />
            <Route path="admin/analytics" element={<AnalyticsPage />} />
            <Route
              path="equipment"
              element={<EquipmentPage />}
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
