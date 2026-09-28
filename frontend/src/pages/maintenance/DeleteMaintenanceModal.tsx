import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  DELETE_MAINTENANCE_MUTATION,
  type DeleteMaintenanceData,
  type DeleteMaintenanceVars,
} from '../../graphql/mutations/maintenance';
import { ROOM_MAINTENANCE_QUERY } from '../../graphql/queries/maintenance';
import type { MaintenanceWindow } from '../../types';
import { formatDateTime } from '../../utils/date';
import { getGraphQLErrorMessage } from '../../utils/errors';

type DeleteMaintenanceModalProps = {
  open: boolean;
  roomId: number;
  window: MaintenanceWindow | null;
  onClose: () => void;
};

/**
 * Removing a maintenance window hands the time back to the booking engine — it
 * is an admin action with no undo — so it is confirmed here, mirroring
 * `CancelBookingModal` / `LeaveWaitlistModal`. It never disables the confirm on
 * client-side time maths: an admin may legitimately delete a window that is
 * already running, and the server's rejection is shown verbatim where the user
 * acted.
 */
export const DeleteMaintenanceModal = ({
  open,
  roomId,
  window: maintenanceWindow,
  onClose,
}: DeleteMaintenanceModalProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const [deleteMaintenance, { loading }] = useMutation<
    DeleteMaintenanceData,
    DeleteMaintenanceVars
  >(DELETE_MAINTENANCE_MUTATION);

  if (!open || !maintenanceWindow) return null;

  const handleDelete = async () => {
    setError(null);
    try {
      const result = await deleteMaintenance({
        variables: { id: maintenanceWindow.id },
        // `deleteMaintenance` returns a Boolean, so the cache holds nothing to
        // update and the window list has to be re-read (§8.40).
        refetchQueries: [
          { query: ROOM_MAINTENANCE_QUERY, variables: { roomId } },
        ],
      });
      if (!result.data?.deleteMaintenance) {
        throw new Error('The server did not confirm the removal.');
      }
      onClose();
    } catch (err) {
      setError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Remove maintenance window">
      <p className="text-[15px] text-body">
        Remove the maintenance window for{' '}
        <span className="font-semibold">
          {formatDateTime(maintenanceWindow.startTime)} –{' '}
          {formatDateTime(maintenanceWindow.endTime)}
        </span>
        ?
      </p>
      {maintenanceWindow.reason && (
        <p className="mt-2 text-sm text-muted">{maintenanceWindow.reason}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <li>
          The room becomes bookable for that time again as soon as the window is
          removed.
        </li>
        <li>Existing bookings are never affected by this action.</li>
        <li>Only an admin can remove a maintenance window.</li>
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Keep window
        </Button>
        <Button
          variant="danger"
          loading={loading}
          onClick={() => void handleDelete()}
        >
          Remove window
        </Button>
      </div>
    </Modal>
  );
};