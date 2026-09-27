import type { ReactNode } from 'react';

type DetailRowProps = {
  label: string;
  /** Text or a node — the room cell in a details page is a link. */
  value: ReactNode;
};

/**
 * One label/value line of a details list. Extracted in Phase 18 from the two
 * copies that had grown up in the Create Booking confirmation panel and the
 * Booking Details cards, so a third surface does not add a third copy.
 */
export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3 last:border-b-0">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="text-right text-sm text-body">{value}</dd>
  </div>
);
