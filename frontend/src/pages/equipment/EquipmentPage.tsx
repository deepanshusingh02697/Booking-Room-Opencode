import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { PanelCard } from '../../components/common/PanelCard';
import {
  EQUIPMENT_QUERY,
  type EquipmentData,
} from '../../graphql/queries/equipment';
import type { Equipment } from '../../types';
import { EquipmentForm } from './EquipmentForm';

export const EquipmentPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const { data, loading, error, refetch } = useQuery<EquipmentData>(
    EQUIPMENT_QUERY,
  );

  const equipment = data?.equipment ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: Equipment) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        sub="Create and rename the equipment that can be assigned to rooms"
        action={
          <Button variant="primary" onClick={openCreate}>
            Add Equipment
          </Button>
        }
      />

      <PanelCard title="Equipment" sub="Everything that can be assigned to a room">
        {error ? (
          <ErrorState
            message="Could not load equipment."
            onRetry={() => void refetch()}
          />
        ) : loading ? (
          <LoadingState />
        ) : equipment.length === 0 ? (
          <EmptyState message="No equipment has been created yet." />
        ) : (
          <div className="flex flex-col">
            {equipment.map((item) => (
              <ListRow
                key={item.id}
                action={
                  <Button variant="outline" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                }
              >
                <span className="text-[15px] text-body">{item.name}</span>
              </ListRow>
            ))}
          </div>
        )}
      </PanelCard>

      <p className="mt-6 text-sm text-muted">
        Equipment is assigned to a room from{' '}
        <Link to="/admin/rooms" className="text-navy underline">
          Admin Rooms
        </Link>
        .
      </p>

      <EquipmentForm
        open={formOpen}
        equipment={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
};
