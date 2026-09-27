import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { PageHeader } from '../../components/common/PageHeader';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import {
  ROOM_DETAILS_QUERY,
  type RoomDetailsData,
  type RoomDetailsVars,
} from '../../graphql/queries/rooms';
import { roomStatusMeta, typeScale } from '../../theme';

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3 last:border-b-0">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="text-sm text-body">{value}</dd>
  </div>
);

export const RoomDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery<
    RoomDetailsData,
    RoomDetailsVars
  >(ROOM_DETAILS_QUERY, { variables: { id: Number(id) } });

  const room = data?.room;

  return (
    <div>
      <PageHeader
        title={room?.name ?? 'Room Details'}
        action={
          <Button variant="secondary" onClick={() => navigate('/rooms')}>
            Back to Rooms
          </Button>
        }
      />

      {error ? (
        <ErrorState message="Could not load this room." onRetry={() => void refetch()} />
      ) : loading || !room ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AppCard>
            <h2 className={typeScale.panelTitle}>Room</h2>
            <p className={`${typeScale.subCaption} mt-2`}>
              Capacity, floor and location
            </p>
            <dl className="mt-4 flex flex-col">
              <DetailRow label="Name" value={room.name} />
              <DetailRow label="Capacity" value={String(room.capacity)} />
              <DetailRow label="Floor" value={String(room.floor)} />
              <DetailRow label="Location" value={room.location} />
            </dl>
          </AppCard>

          <AppCard>
            <h2 className={typeScale.panelTitle}>Availability</h2>
            <p className={`${typeScale.subCaption} mt-2`}>
              Live status and current occupancy
            </p>
            <div className="mt-4 flex items-center gap-3">
              <StatusBadge meta={roomStatusMeta[room.status]} />
            </div>
            <dl className="mt-4 flex flex-col">
              <DetailRow
                label="Occupants now"
                value={room.occupantCount === undefined ? '—' : String(room.occupantCount)}
              />
              <DetailRow
                label="Remaining capacity"
                value={
                  room.remainingCapacity === undefined
                    ? '—'
                    : String(room.remainingCapacity)
                }
              />
            </dl>
          </AppCard>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        Looking to book it?{' '}
        <Link to="/create-booking" className="text-navy underline">
          Create Booking
        </Link>{' '}
        lands in Phase 16.
      </p>
    </div>
  );
};
