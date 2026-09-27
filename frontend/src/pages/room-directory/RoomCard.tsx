import { useNavigate } from 'react-router-dom';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { roomStatusMeta, typeScale } from '../../theme';
import type { Room } from '../../types';

type RoomCardProps = {
  room: Room;
};

export const RoomCard = ({ room }: RoomCardProps) => {
  const navigate = useNavigate();

  return (
    <AppCard className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h2 className={typeScale.panelTitle}>{room.name}</h2>
        <StatusBadge meta={roomStatusMeta[room.status]} />
      </div>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Capacity</dt>
          <dd className="text-body">{room.capacity}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Floor</dt>
          <dd className="text-body">{room.floor}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Location</dt>
          <dd className="text-body">{room.location}</dd>
        </div>
      </dl>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => navigate(`/rooms/${room.id}`)}>
          View Details
        </Button>
      </div>
    </AppCard>
  );
};
