import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { PanelCard } from '../../components/common/PanelCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ADMIN_CALENDAR_QUERY,
  USAGE_ANALYTICS_QUERY,
  type AdminCalendarData,
  type AdminCalendarVars,
  type UsageAnalyticsData,
  type UsageAnalyticsVars,
} from '../../graphql/queries/analytics';
import { ROOMS_QUERY, type RoomsData, type RoomsVars } from '../../graphql/queries/rooms';
import { copy, layout, bookingStatusMeta } from '../../theme';
import { BookingStatus, RoomStatus } from '../../types';
import { formatTimeRange, todayRangeInput } from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const range = useMemo(() => todayRangeInput(), []);

  const calendar = useQuery<AdminCalendarData, AdminCalendarVars>(
    ADMIN_CALENDAR_QUERY,
    { variables: { input: range } },
  );
  const usage = useQuery<UsageAnalyticsData, UsageAnalyticsVars>(
    USAGE_ANALYTICS_QUERY,
    { variables: { input: range } },
  );
  const availableRooms = useQuery<RoomsData, RoomsVars>(ROOMS_QUERY, {
    variables: { filter: { status: RoomStatus.AVAILABLE } },
  });
  const maintenanceRooms = useQuery<RoomsData, RoomsVars>(ROOMS_QUERY, {
    variables: { filter: { status: RoomStatus.MAINTENANCE } },
  });

  const bookings = calendar.data?.adminCalendar ?? [];
  const usageRows = usage.data?.usageAnalytics ?? [];

  const stats = copy.adminStats;
  const panels = copy.adminPanels;

  return (
    <div>
      <PageHeader
        title={`Welcome Back, ${user?.firstName ?? ''}`}
        sub={copy.adminGreetingSub}
      />

      {calendar.error ? (
        <ErrorState
          message="Could not load today's bookings."
          onRetry={() => void calendar.refetch()}
        />
      ) : (
        <div className={layout.statRow4}>
          <StatCard
            value={calendar.loading ? 0 : bookings.length}
            label={stats.todaysBookings}
          />
          <StatCard
            value={
              calendar.loading
                ? 0
                : bookings.filter((b) => b.status === BookingStatus.CANCELLED).length
            }
            label={stats.cancelled}
          />
          <StatCard
            value={
              calendar.loading
                ? 0
                : bookings.filter((b) => b.status === BookingStatus.NO_SHOW).length
            }
            label={stats.noShow}
          />
          <StatCard
            value={
              availableRooms.loading || maintenanceRooms.loading
                ? 0
                : (availableRooms.data?.rooms.length ?? 0) +
                  (maintenanceRooms.data?.rooms.length ?? 0)
            }
            label={stats.activeRooms}
          />
        </div>
      )}

      <div className={`${layout.panelRow} mt-5`}>
        <PanelCard title={panels.todaysBookings.title} sub={panels.todaysBookings.sub}>
          {calendar.loading ? (
            <LoadingState />
          ) : bookings.length === 0 ? (
            <EmptyState message={panels.todaysBookings.empty} />
          ) : (
            <div className="flex flex-col">
              {bookings.map((booking) => (
                <ListRow
                  key={booking.id}
                  action={
                    <StatusBadge meta={bookingStatusMeta[booking.status]} />
                  }
                >
                  <p className="truncate text-[15px] text-body">{booking.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatTimeRange(booking.startTime, booking.endTime)}
                    {booking.room ? ` · ${booking.room.name}` : ''}
                  </p>
                </ListRow>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title={panels.roomUsage.title} sub={panels.roomUsage.sub}>
          {usage.loading ? (
            <LoadingState />
          ) : usageRows.length === 0 ? (
            <EmptyState message={panels.roomUsage.empty} />
          ) : (
            <div className="flex flex-col">
              {usageRows.map((row) => (
                <ListRow key={row.roomId}>
                  <p className="truncate text-[15px] text-body">{row.roomName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {row.totalBookings} booked · {row.cancellations} cancelled ·{' '}
                    {row.noShows} no-show
                  </p>
                </ListRow>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};
