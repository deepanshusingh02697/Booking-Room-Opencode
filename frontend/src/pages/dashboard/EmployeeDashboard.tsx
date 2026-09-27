import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuPlus } from 'react-icons/lu';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { PanelCard } from '../../components/common/PanelCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  MY_MEETINGS_QUERY,
  type MyMeetingsData,
} from '../../graphql/queries/bookings';
import { ROOMS_QUERY, type RoomsData, type RoomsVars } from '../../graphql/queries/rooms';
import { bookingStatusMeta, copy, layout } from '../../theme';
import { RoomStatus, type Booking } from '../../types';
import {
  formatTimeRange,
  isAfterLocalDay,
  isSameLocalDay,
  startOfTomorrow,
} from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';

const MeetingRow = ({ booking }: { booking: Booking }) => (
  <ListRow action={<StatusBadge meta={bookingStatusMeta[booking.status]} />}>
    <p className="truncate text-[15px] text-body">{booking.title}</p>
    <p className="mt-1 text-sm text-muted">
      {formatTimeRange(booking.startTime, booking.endTime)}
      {booking.room ? ` · ${booking.room.name}` : ''}
    </p>
  </ListRow>
);

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meetings = useQuery<MyMeetingsData>(MY_MEETINGS_QUERY);
  const availableRooms = useQuery<RoomsData, RoomsVars>(ROOMS_QUERY, {
    variables: { filter: { status: RoomStatus.AVAILABLE } },
  });

  const all = meetings.data?.myMeetings ?? [];
  const todayStart = useMemo(() => startOfTomorrow(), []);

  const todaysMeetings = useMemo(
    () => all.filter((m) => isSameLocalDay(m.startTime)),
    [all],
  );
  const upcomingMeetings = useMemo(
    () => all.filter((m) => isAfterLocalDay(m.startTime, todayStart)),
    [all, todayStart],
  );

  const stats = copy.employeeStats;
  const panels = copy.employeePanels;
  const buttons = copy.dashboardButtons;

  return (
    <div>
      <PageHeader
        title={`Welcome Back, ${user?.firstName ?? ''}`}
        sub={copy.employeeGreetingSub}
        topPad="pt-10"
      />

      {meetings.error ? (
        <ErrorState
          message="Could not load your meetings."
          onRetry={() => void meetings.refetch()}
        />
      ) : (
        <div className={layout.statRow3}>
          <StatCard
            value={meetings.loading ? 0 : todaysMeetings.length}
            label={stats.todaysMeetings}
          />
          <StatCard
            value={meetings.loading ? 0 : upcomingMeetings.length}
            label={stats.upcomingMeetings}
          />
          <StatCard
            value={availableRooms.loading ? 0 : (availableRooms.data?.rooms.length ?? 0)}
            label={stats.roomsAvailable}
          />
        </div>
      )}

      <div className={`${layout.panelRow} mt-5`}>
        <PanelCard
          title={panels.todaysMeetings.title}
          sub={panels.todaysMeetings.sub}
        >
          {meetings.loading ? (
            <LoadingState />
          ) : todaysMeetings.length === 0 ? (
            <EmptyState message={panels.todaysMeetings.empty} />
          ) : (
            <div className="flex flex-col">
              {todaysMeetings.map((meeting) => (
                <MeetingRow key={meeting.id} booking={meeting} />
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title={panels.quickAction.title}
          sub={panels.quickAction.sub}
        >
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              variant="primary"
              icon={<LuPlus aria-hidden />}
              onClick={() => navigate('/create-booking')}
            >
              {buttons.bookARoom}
            </Button>
            <Button variant="outline" onClick={() => navigate('/rooms')}>
              {buttons.findARoom}
            </Button>
            <Button variant="outline" onClick={() => navigate('/bookings')}>
              {buttons.viewMyBookings}
            </Button>
          </div>
        </PanelCard>
      </div>

      <div className="mt-5">
        <PanelCard
          title={panels.upcomingMeetings.title}
          sub={panels.upcomingMeetings.sub}
        >
          {meetings.loading ? (
            <LoadingState />
          ) : upcomingMeetings.length === 0 ? (
            <EmptyState message={panels.upcomingMeetings.empty} />
          ) : (
            <div className="flex flex-col">
              {upcomingMeetings.map((meeting) => (
                <MeetingRow key={meeting.id} booking={meeting} />
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};
