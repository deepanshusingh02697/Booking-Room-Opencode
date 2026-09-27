import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { PanelCard } from '../../components/common/PanelCard';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { DateTimePicker } from '../../components/forms/DateTimePicker';
import { localInputToGraphQLDate } from '../../utils/date';
import { RoomStatus } from '../../types';

export type RoomFiltersValue = {
  status?: RoomStatus;
  minCapacity?: number;
  floor?: number;
  startTime?: string;
  endTime?: string;
};

type RoomFiltersProps = {
  value: RoomFiltersValue;
  onChange: (value: RoomFiltersValue) => void;
};

const statusOptions = [
  { value: '', label: 'Any status' },
  { value: RoomStatus.AVAILABLE, label: 'Available' },
  { value: RoomStatus.MAINTENANCE, label: 'Maintenance' },
  { value: RoomStatus.DISABLED, label: 'Disabled' },
];

export const RoomFilters = ({ value, onChange }: RoomFiltersProps) => {
  const [status, setStatus] = useState(value.status ?? '');
  const [minCapacity, setMinCapacity] = useState(
    value.minCapacity?.toString() ?? '',
  );
  const [floor, setFloor] = useState(value.floor?.toString() ?? '');
  const [startTime, setStartTime] = useState(value.startTime ?? '');
  const [endTime, setEndTime] = useState(value.endTime ?? '');

  const apply = () => {
    const next: RoomFiltersValue = {};

    if (status) next.status = status as RoomStatus;

    const capacity = Number(minCapacity);
    if (minCapacity && Number.isInteger(capacity) && capacity >= 1) {
      next.minCapacity = capacity;
    }

    const floorNumber = Number(floor);
    if (floor && Number.isInteger(floorNumber) && floorNumber >= 0) {
      next.floor = floorNumber;
    }

    if (startTime && endTime) {
      next.startTime = localInputToGraphQLDate(startTime);
      next.endTime = localInputToGraphQLDate(endTime);
    }

    onChange(next);
  };

  const clear = () => {
    setStatus('');
    setMinCapacity('');
    setFloor('');
    setStartTime('');
    setEndTime('');
    onChange({});
  };

  return (
    <PanelCard
      title="Filters"
      sub="Narrow the catalog by status, capacity, floor or a free slot"
      action={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={clear}>
            Clear
          </Button>
          <Button variant="primary" onClick={apply}>
            Apply
          </Button>
        </div>
      }
    >
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Select
          label="Status"
          name="status"
          value={status}
          options={statusOptions}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Input
          label="Min capacity"
          name="minCapacity"
          type="number"
          min={1}
          value={minCapacity}
          placeholder="Any"
          onChange={(e) => setMinCapacity(e.target.value)}
        />
        <Input
          label="Floor"
          name="floor"
          type="number"
          min={0}
          value={floor}
          placeholder="Any"
          onChange={(e) => setFloor(e.target.value)}
        />
        <DateTimePicker
          label="Free from"
          name="startTime"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <DateTimePicker
          label="Free until"
          name="endTime"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
    </PanelCard>
  );
};
