import { lazy, Suspense } from 'react';
import { ActionIcon, Group, Loader, Skeleton } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { DownloadAsButton } from './DownloadAsButton';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

interface ExportHeaderProps {
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export function ExportHeader({ onSync, isSyncing = false }: ExportHeaderProps) {
  const isSyncEnabled = typeof onSync === 'function';

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Suspense
        fallback={
          <Group gap="sm" align="center">
            <Skeleton height={34} width={200} radius="sm" />
            {isSyncEnabled ? <Skeleton height={36} width={36} radius="md" /> : null}
          </Group>
        }
      >
        <Group gap="sm" align="center">
          <EventHeader pageInfo="Data Validation" />
          {isSyncEnabled ? (
            <ActionIcon
              aria-label="Sync data validation"
              size="lg"
              radius="md"
              variant="default"
              style={{ backgroundColor: 'var(--mantine-color-body)' }}
              onClick={() => {
                if (onSync) {
                  void onSync();
                }
              }}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader size="sm" /> : <IconRefresh size={20} />}
            </ActionIcon>
          ) : null}
        </Group>
      </Suspense>
      <DownloadAsButton />
    </Group>
  );
}
