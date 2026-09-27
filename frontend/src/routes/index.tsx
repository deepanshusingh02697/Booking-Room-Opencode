import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { LoginPage } from '../pages/login/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { RoomDirectoryPage } from '../pages/room-directory/RoomDirectoryPage';
import { RoomDetailsPage } from '../pages/room-details/RoomDetailsPage';
import { AdminRoomsPage } from '../pages/admin-rooms/AdminRoomsPage';
import { EquipmentPage } from '../pages/equipment/EquipmentPage';
import { CreateBookingPage } from '../pages/create-booking/CreateBookingPage';
import { MyBookingsPage } from '../pages/my-bookings/MyBookingsPage';
import { MyMeetingsPage } from '../pages/my-meetings/MyMeetingsPage';
import { BookingDetailsPage } from '../pages/booking-details/BookingDetailsPage';
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
          <Route
            path="wait-list"
            element={<PlaceholderPage title="Wait-List" phase="Phase 20" />}
          />
          <Route path="meetings" element={<MyMeetingsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin/rooms" element={<AdminRoomsPage />} />
            <Route
              path="admin/calendar"
              element={
                <PlaceholderPage title="Admin Calendar" phase="Phase 22" />
              }
            />
            <Route
              path="admin/analytics"
              element={<PlaceholderPage title="Analytics" phase="Phase 22" />}
            />
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
