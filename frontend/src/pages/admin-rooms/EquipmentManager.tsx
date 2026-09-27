import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import {
  ASSIGN_EQUIPMENT_MUTATION,
  REMOVE_EQUIPMENT_MUTATION,
  type AssignEquipmentData,
  type AssignEquipmentVars,
  type RemoveEquipmentData,
  type RemoveEquipmentVars,
} from '../../graphql/mutations/equipment';
import {
  EQUIPMENT_QUERY,
  type EquipmentData,
} from '../../graphql/queries/equipment';
import { field } from '../../theme';
import type { Equipment, Room } from '../../types';
import { getGraphQLErrorMessage } from '../../utils/errors';

type EquipmentManagerProps = {
  open: boolean;
  room: Room | null;
  onClose: () => void;
};

export const EquipmentManager = ({
  open,
  room,
  onClose,
}: EquipmentManagerProps) => {
  const [assigned, setAssigned] = useState<Equipment[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setAssigned(room?.equipment ?? []);
    setActionError(null);
    setPendingId(null);
  }, [open, room]);

  const { data, loading, error, refetch } = useQuery<EquipmentData>(
    EQUIPMENT_QUERY,
    { skip: !open },
  );
  const [assignEquipment, assignState] = useMutation<
    AssignEquipmentData,
    AssignEquipmentVars
  >(ASSIGN_EQUIPMENT_MUTATION);
  const [removeEquipment, removeState] = useMutation<
    RemoveEquipmentData,
    RemoveEquipmentVars
  >(REMOVE_EQUIPMENT_MUTATION);

  const busy = assignState.loading || removeState.loading;
  const all = data?.equipment ?? [];
  const assignedIds = new Set(assigned.map((item) => item.id));
  const available = all.filter((item) => !assignedIds.has(item.id));

  const handleAssign = async (item: Equipment) => {
    if (!room) return;
    setActionError(null);
    setPendingId(item.id);
    try {
      const result = await assignEquipment({
        variables: { input: { roomId: room.id, equipmentId: item.id } },
      });
      setAssigned(result.data?.assignEquipmentToRoom.equipment ?? []);
    } catch (err) {
      setActionError(getGraphQLErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (item: Equipment) => {
    if (!room) return;
    setActionError(null);
    setPendingId(item.id);
    try {
      const result = await removeEquipment({
        variables: { input: { roomId: room.id, equipmentId: item.id } },
      });
      setAssigned(result.data?.removeEquipmentFromRoom.equipment ?? []);
    } catch (err) {
      setActionError(getGraphQLErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  if (!open || !room) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={`Equipment · ${room.name}`}
    >
      {error ? (
        <ErrorState
          message="Could not load equipment."
          onRetry={() => void refetch()}
        />
      ) : loading ? (
        <LoadingState />
      ) : (
        <>
          {actionError && (
            <p role="alert" className="mb-4 text-sm font-medium text-red-600">
              {actionError}
            </p>
          )}

          <p className={field.label}>Assigned ({assigned.length})</p>
          <div className="mt-2 flex flex-col">
            {assigned.length === 0 ? (
              <p className="text-sm text-muted">
                No equipment is assigned to this room yet.
              </p>
            ) : (
              assigned.map((item) => (
                <ListRow
                  key={item.id}
                  action={
                    <Button
                      variant="outline"
                      loading={busy && pendingId === item.id}
                      disabled={busy}
                      onClick={() => void handleRemove(item)}
                    >
                      Remove
                    </Button>
                  }
                >
                  <span className="text-[15px] text-body">{item.name}</span>
                </ListRow>
              ))
            )}
          </div>

          <p className={`${field.label} mt-6`}>
            Available ({available.length})
          </p>
          <div className="mt-2 flex flex-col">
            {available.length === 0 ? (
              <p className="text-sm text-muted">
                Every piece of equipment is already assigned to this room.
              </p>
            ) : (
              available.map((item) => (
                <ListRow
                  key={item.id}
                  action={
                    <Button
                      variant="primary"
                      loading={busy && pendingId === item.id}
                      disabled={busy}
                      onClick={() => void handleAssign(item)}
                    >
                      Add
                    </Button>
                  }
                >
                  <span className="text-[15px] text-body">{item.name}</span>
                </ListRow>
              ))
            )}
          </div>
        </>
      )}
    </Modal>
  );
};
