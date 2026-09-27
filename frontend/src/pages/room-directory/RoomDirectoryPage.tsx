import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { ROOMS_QUERY, type RoomsData, type RoomsVars } from '../../graphql/queries/rooms';
import { RoomCard } from './RoomCard';
import { RoomFilters, type RoomFiltersValue } from './RoomFilters';

export const RoomDirectoryPage = () => {
  const [filters, setFilters] = useState<RoomFiltersValue>({});

  const { data, loading, error, refetch } = useQuery<RoomsData, RoomsVars>(
    ROOMS_QUERY,
    { variables: { filter: filters } },
  );

  const rooms = data?.rooms ?? [];

  return (
    <div>
      <PageHeader
        title="Rooms"
        sub="Search the catalog and see which rooms are free for a selected slot"
      />

      <RoomFilters value={filters} onChange={setFilters} />

      <div className="mt-5">
        {error ? (
          <ErrorState
            message="Could not load rooms."
            onRetry={() => void refetch()}
          />
        ) : loading ? (
          <LoadingState />
        ) : rooms.length === 0 ? (
          <EmptyState message="No rooms match these filters." />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
