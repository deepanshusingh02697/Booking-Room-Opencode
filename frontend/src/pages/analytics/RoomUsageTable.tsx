import { Link } from 'react-router-dom';
import type { RoomUsage } from '../../types';

const HEADING_CLASS = 'text-xs uppercase tracking-[0.08em] text-faint';
const NUMBER_CLASS = 'text-[15px] text-body tabular-nums';
const HEADING_NUMBER_CLASS = `${HEADING_CLASS} text-right`;

type RoomUsageTableProps = {
  rows: RoomUsage[];
};

/**
 * The per-room usage report. The first table in the app, improvised on the
 * §7.2 tokens (doc/project-state.md §7.2.11 does not decide table styling) and
 * therefore built from the same pieces as every other surface: a `faint` caption
 * heading, `rule` row separators, `body` labels and right-aligned tabular
 * numerals so the columns line up.
 *
 * The numbers are the server's own — `usageAnalytics` returns one row per room,
 * an idle room included as 0/0/0, and nothing is re-counted here; the totals
 * live in the stat tiles above. That query carries no ORDER BY, so the rows are
 * ordered by room name here instead: a report whose row order shifts between
 * loads cannot be read down a column.
 */
export const RoomUsageTable = ({ rows }: RoomUsageTableProps) => {
  const ordered = [...rows].sort((a, b) =>
    a.roomName.localeCompare(b.roomName, undefined, { sensitivity: 'base' }),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className={`${HEADING_CLASS} py-2 text-left`}>
              Room
            </th>
            <th scope="col" className={`${HEADING_NUMBER_CLASS} py-2`}>
              Total bookings
            </th>
            <th scope="col" className={`${HEADING_NUMBER_CLASS} py-2`}>
              Cancellations
            </th>
            <th scope="col" className={`${HEADING_NUMBER_CLASS} py-2`}>
              No-shows
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.roomId} className="border-b border-rule last:border-b-0">
              <th scope="row" className="py-3 text-left">
                <Link
                  to={`/rooms/${row.roomId}`}
                  className="rounded text-[15px] text-body hover:text-navy hover:underline focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  {row.roomName}
                </Link>
              </th>
              <td className={`${NUMBER_CLASS} py-3 text-right`}>
                {row.totalBookings}
              </td>
              <td className={`${NUMBER_CLASS} py-3 text-right`}>
                {row.cancellations}
              </td>
              <td className={`${NUMBER_CLASS} py-3 text-right`}>{row.noShows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
