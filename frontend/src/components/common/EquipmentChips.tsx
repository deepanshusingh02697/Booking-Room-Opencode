import type { Equipment } from '../../types';

type EquipmentChipsProps = {
  equipment?: Equipment[];
  max?: number;
  emptyText?: string;
  className?: string;
};

export const EquipmentChips = ({
  equipment,
  max,
  emptyText = 'No equipment',
  className = '',
}: EquipmentChipsProps) => {
  if (!equipment || equipment.length === 0) {
    return <p className={`text-sm text-muted ${className}`}>{emptyText}</p>;
  }

  const shown = max ? equipment.slice(0, max) : equipment;
  const rest = max ? equipment.length - shown.length : 0;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {shown.map((item) => (
        <span
          key={item.id}
          className="rounded border border-rule bg-white px-2.5 py-1 text-sm text-body"
        >
          {item.name}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded border border-rule bg-white px-2.5 py-1 text-sm text-muted">
          +{rest} more
        </span>
      )}
    </div>
  );
};
