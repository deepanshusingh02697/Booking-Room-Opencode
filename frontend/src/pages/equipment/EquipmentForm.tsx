import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/forms/Input';
import { getGraphQLErrorMessage } from '../../utils/errors';
import {
  CREATE_EQUIPMENT_MUTATION,
  UPDATE_EQUIPMENT_MUTATION,
  type CreateEquipmentData,
  type CreateEquipmentVars,
  type UpdateEquipmentData,
  type UpdateEquipmentVars,
} from '../../graphql/mutations/equipment';
import type { Equipment } from '../../types';

type EquipmentFormProps = {
  open: boolean;
  equipment: Equipment | null;
  onClose: () => void;
  onSaved: () => void;
};

export const EquipmentForm = ({
  open,
  equipment,
  onClose,
  onSaved,
}: EquipmentFormProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(equipment?.name ?? '');
    setError(null);
    setFormError(null);
  }, [open, equipment]);

  const [createEquipment, createState] = useMutation<
    CreateEquipmentData,
    CreateEquipmentVars
  >(CREATE_EQUIPMENT_MUTATION);
  const [updateEquipment, updateState] = useMutation<
    UpdateEquipmentData,
    UpdateEquipmentVars
  >(UPDATE_EQUIPMENT_MUTATION);

  const busy = createState.loading || updateState.loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Equipment name is required.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Equipment name must be at most 100 characters.');
      return;
    }
    setError(null);

    try {
      if (equipment) {
        await updateEquipment({
          variables: { input: { id: equipment.id, name: trimmed } },
        });
      } else {
        await createEquipment({ variables: { input: { name: trimmed } } });
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
      title={equipment ? 'Rename Equipment' : 'Add Equipment'}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Name"
          name="name"
          value={name}
          error={error ?? undefined}
          maxLength={100}
          placeholder="Projector"
          onChange={(e) => setName(e.target.value)}
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
            {equipment ? 'Save Changes' : 'Create Equipment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
