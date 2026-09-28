import { useQuery } from '@apollo/client';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PanelCard } from '../../components/common/PanelCard';
import {
  ROOM_MAINTENANCE_QUERY,
  type RoomMaintenanceData,
  type RoomMaintenanceVars,
} from '../../graphql/queries/maintenance';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import {
  isActiveMaintenance,
  splitMaintenanceWindows,
} from '../../utils/maintenance';
import { MaintenanceRow } from './MaintenanceRow';

type MaintenancePanelProps = {
  roomId: number;
  className?: string;
};

/**
 * The room's maintenance windows, on the room's page, for any authenticated
 * role. This is where an employee looking at a room learns *why* a slot is
 * blocked: the booking engine refuses the window, and a maintenance window on
 * an AVAILABLE room never shows in the room's own status badge.
 *
 * Only scheduled windows are listed (active + upcoming, soonest first) — the
 * room page answers "can I book this now / soon", and passed history is the
 * admin manager's job.
 */
export const MaintenancePanel = ({
  roomId,
  className = '',
}: MaintenancePanelProps) => {
  const { data, loading, error, refetch } = useQuery<
    RoomMaintenanceData,
    RoomMaintenanceVars
  >(ROOM_MAINTENANCE_QUERY, { variables: { roomId } });

  useRefetchOnFocus(() => {
    void refetch();
  });

  const now = new Date();
  const { scheduled } = splitMaintenanceWindows(
    data?.roomMaintenance ?? [],
    now,
  );

  return (
    <PanelCard
      title="Maintenance"
      sub="Scheduled work in this room"
      className={className}
    >
      {error ? (
        <ErrorState
          message="Could not load this room's maintenance windows."
          onRetry={() => void refetch()}
        />
      ) : loading ? (
        <LoadingState />
      ) : scheduled.length === 0 ? (
        <EmptyState message="No maintenance is scheduled for this room." />
      ) : (
        <div className="flex flex-col">
          {scheduled.map((window) => (
            <MaintenanceRow
              key={window.id}
              window={window}
              note={
                isActiveMaintenance(window, now) ? 'In progress' : undefined
              }
            />
          ))}
        </div>
      )}
    </PanelCard>
  );
};