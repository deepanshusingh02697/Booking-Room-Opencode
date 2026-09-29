import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuPlus } from 'react-icons/lu';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { PanelCard } from '../../components/common/PanelCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { BookingRow } from '../../components/common/BookingRow';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/common/Button';
import {
  MY_MEETINGS_QUERY,
  type MyMeetingsData,
} from '../../graphql/queries/bookings';
import { ROOMS_QUERY, type RoomsData, type RoomsVars } from '../../graphql/queries/rooms';
import { copy, layout } from '../../theme';
import { RoomStatus } from '../../types';
import {
  isAfterLocalDay,
  isSameLocalDay,
  startOfTomorrow,
} from '../../utils/date';
import { bookingRowNote, buildRecurrenceNotes } from '../../utils/recurrence';
import { useAuth } from '../../hooks/useAuth';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meetings = useQuery<MyMeetingsData>(MY_MEETINGS_QUERY);
  const availableRooms = useQuery<RoomsData, RoomsVars>(ROOMS_QUERY, {
    variables: { filter: { status: RoomStatus.AVAILABLE } },
  });

  const all = meetings.data?.myMeetings ?? [];
  const todayStart = useMemo(() => startOfTomorrow(), []);
  const recurrenceNotes = useMemo(() => buildRecurrenceNotes(all), [all]);

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
                <BookingRow
                  key={meeting.id}
                  booking={meeting}
                  note={bookingRowNote(meeting, recurrenceNotes)}
                />
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title={panels.quickAction.title}
          sub={panels.quickAction.sub}
        >
          <div className="mt-6 flex items-center gap-3">
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
                <BookingRow
                  key={meeting.id}
                  booking={meeting}
                  note={bookingRowNote(meeting, recurrenceNotes)}
                />
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};
