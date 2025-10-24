import { lazy, Suspense } from 'react';
import { ActionIcon, Group, Loader, Skeleton } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { DownloadAsButton } from './DownloadAsButton';
import classes from './ExportHeader.module.css';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

interface ExportHeaderProps {
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
  showDownloadButton?: boolean;
}

export function ExportHeader({
  onSync,
  isSyncing = false,
  showDownloadButton = true,
}: ExportHeaderProps) {
  const isSyncEnabled = typeof onSync === 'function';

  return (
    <Group className={classes.container} align="center" justify="center" gap="md" wrap="wrap">
      <Group gap="sm" align="center" justify="center" wrap="wrap">
        <Suspense
          fallback={
            <Group gap="sm" align="center" justify="center">
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
        {showDownloadButton ? <DownloadAsButton /> : null}
      </Group>
    </Group>
  );
}
