import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PageHeader } from '../../components/common/PageHeader';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Select } from '../../components/forms/Select';
import {
  SET_ROOM_STATUS_MUTATION,
  type SetRoomStatusData,
  type SetRoomStatusVars,
} from '../../graphql/mutations/rooms';
import { ROOMS_QUERY, type RoomsData, type RoomsVars } from '../../graphql/queries/rooms';
import { roomStatusMeta } from '../../theme';
import { RoomStatus, type Room } from '../../types';
import { getGraphQLErrorMessage } from '../../utils/errors';
import { RoomForm } from './RoomForm';

const statusOptions = [
  { value: RoomStatus.AVAILABLE, label: 'Available' },
  { value: RoomStatus.MAINTENANCE, label: 'Maintenance' },
  { value: RoomStatus.DISABLED, label: 'Disabled' },
];

export const AdminRoomsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<RoomsData, RoomsVars>(
    ROOMS_QUERY,
  );
  const [setRoomStatus, setStatusState] = useMutation<
    SetRoomStatusData,
    SetRoomStatusVars
  >(SET_ROOM_STATUS_MUTATION);

  const rooms = data?.rooms ?? [];

  const openCreate = () => {
    setEditing(null);
    setActionError(null);
    setFormOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setActionError(null);
    setFormOpen(true);
  };

  const handleStatusChange = async (room: Room, status: RoomStatus) => {
    setActionError(null);
    try {
      await setRoomStatus({ variables: { input: { id: room.id, status } } });
      await refetch();
    } catch (err) {
      setActionError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Rooms"
        sub="Create, edit and change the operational status of every room"
        action={
          <Button variant="primary" onClick={openCreate}>
            Add Room
          </Button>
        }
      />

      {actionError && (
        <p role="alert" className="mb-5 text-sm font-medium text-red-600">
          {actionError}
        </p>
      )}

      {error ? (
        <ErrorState message="Could not load rooms." onRetry={() => void refetch()} />
      ) : loading ? (
        <LoadingState />
      ) : rooms.length === 0 ? (
        <EmptyState message="No rooms have been created yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map((room) => (
            <AppCard key={room.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-heading">{room.name}</h2>
                    <StatusBadge meta={roomStatusMeta[room.status]} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Capacity {room.capacity} · Floor {room.floor} · {room.location}
                  </p>
                </div>

                <div className="flex items-end gap-3">
                  <Select
                    label="Status"
                    name={`status-${room.id}`}
                    value={room.status}
                    options={statusOptions}
                    onChange={(e) =>
                      void handleStatusChange(room, e.target.value as RoomStatus)
                    }
                    disabled={setStatusState.loading}
                  />
                  <Button variant="outline" onClick={() => openEdit(room)}>
                    Edit
                  </Button>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      )}

      <RoomForm
        open={formOpen}
        room={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
};
