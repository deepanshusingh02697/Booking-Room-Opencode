import type { ReactNode } from 'react';
import { ListRow } from '../../components/common/ListRow';
import type { MaintenanceWindow } from '../../types';
import { formatDateTime } from '../../utils/date';

type MaintenanceRowProps = {
  window: MaintenanceWindow;
  /** Extra context such as "In progress", appended after the reason. */
  note?: string;
  action?: ReactNode;
  /** The room's name, appended to the first line where the room is not implied. */
  roomName?: string;
  /**
   * Replaces the first line's time range, for a row whose window is clipped to
   * the day being shown (`All day`, or the part of a multi-day window that
   * touches this day). Without it the row shows the window's full span, which
   * is what a list of whole windows wants.
   */
  timeLabel?: string;
};

/**
 * One maintenance window in an in-card list, shared by the admin manager and
 * the Room Details panel so a window looks the same in both. Like `WaitlistRow`
 * it is a plain `ListRow` — nothing here is a bookable entity, so there is no
 * whole-row link. The admin calendar reuses it too, with a `timeLabel` and a
 * `roomName`, rather than growing a second window row.
 */
export const MaintenanceRow = ({
  window,
  note,
  action,
  roomName,
  timeLabel,
}: MaintenanceRowProps) => {
  const when =
    timeLabel ??
    `${formatDateTime(window.startTime)} – ${formatDateTime(window.endTime)}`;

  return (
    <ListRow action={action}>
      <p className="text-[15px] text-body">
        {when}
        {roomName ? ` · ${roomName}` : ''}
      </p>
      {(window.reason || note) && (
        <p className="mt-1 text-sm text-muted">
          {[window.reason, note].filter(Boolean).join(' · ')}
        </p>
      )}
    </ListRow>
  );
};
