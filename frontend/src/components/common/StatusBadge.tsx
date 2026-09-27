import type { StatusMeta } from '../../theme';

type StatusBadgeProps = {
  meta: StatusMeta;
};

export const StatusBadge = ({ meta }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </span>
  );
};
