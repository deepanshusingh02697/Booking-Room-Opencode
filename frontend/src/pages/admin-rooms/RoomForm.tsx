import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Input';
import { getGraphQLErrorMessage } from '../../utils/errors';
import {
  CREATE_ROOM_MUTATION,
  UPDATE_ROOM_MUTATION,
  type CreateRoomData,
  type CreateRoomVars,
  type UpdateRoomData,
  type UpdateRoomVars,
} from '../../graphql/mutations/rooms';
import type { Room } from '../../types';

type RoomFormProps = {
  open: boolean;
  room: Room | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormErrors = Partial<
  Record<'name' | 'capacity' | 'floor' | 'location', string>
>;

const validate = (values: {
  name: string;
  capacity: string;
  floor: string;
  location: string;
}): FormErrors => {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = 'Room name is required.';
  else if (values.name.length > 100)
    errors.name = 'Room name must be at most 100 characters.';

  const capacity = Number(values.capacity);
  if (!Number.isInteger(capacity) || capacity < 1)
    errors.capacity = 'Capacity must be at least 1.';

  const floor = Number(values.floor);
  if (!Number.isInteger(floor) || floor < 0)
    errors.floor = 'Floor cannot be negative.';

  if (!values.location.trim()) errors.location = 'Location is required.';
  else if (values.location.length > 255)
    errors.location = 'Location must be at most 255 characters.';

  return errors;
};

export const RoomForm = ({ open, room, onClose, onSaved }: RoomFormProps) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [floor, setFloor] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(room?.name ?? '');
    setCapacity(room?.capacity?.toString() ?? '');
    setFloor(room?.floor?.toString() ?? '');
    setLocation(room?.location ?? '');
    setErrors({});
    setFormError(null);
  }, [open, room]);

  const [createRoom, createState] = useMutation<
    CreateRoomData,
    CreateRoomVars
  >(CREATE_ROOM_MUTATION);
  const [updateRoom, updateState] = useMutation<
    UpdateRoomData,
    UpdateRoomVars
  >(UPDATE_ROOM_MUTATION);

  const busy = createState.loading || updateState.loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const found = validate({ name, capacity, floor, location });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      if (room) {
        await updateRoom({
          variables: {
            input: {
              id: room.id,
              name: name.trim(),
              capacity: Number(capacity),
              floor: Number(floor),
              location: location.trim(),
            },
          },
        });
      } else {
        await createRoom({
          variables: {
            input: {
              name: name.trim(),
              capacity: Number(capacity),
              floor: Number(floor),
              location: location.trim(),
            },
          },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(getGraphQLErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room ? 'Edit Room' : 'Add Room'}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Name"
          name="name"
          value={name}
          error={errors.name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Capacity"
          name="capacity"
          type="number"
          min={1}
          value={capacity}
          error={errors.capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Input
          label="Floor"
          name="floor"
          type="number"
          min={0}
          value={floor}
          error={errors.floor}
          onChange={(e) => setFloor(e.target.value)}
        />
        <Input
          label="Location"
          name="location"
          value={location}
          error={errors.location}
          maxLength={255}
          onChange={(e) => setLocation(e.target.value)}
        />

        {formError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {formError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {room ? 'Save Changes' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
