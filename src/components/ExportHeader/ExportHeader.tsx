import { lazy, Suspense } from 'react';
import { ActionIcon, Box, Group, Loader, Skeleton } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { DownloadAsButton } from './DownloadAsButton';
import { StatsRing, type StatsRingDataItem } from '../StatsRing/StatsRing';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

interface ExportHeaderProps {
  onSync?: () => Promise<void> | void;
  isSyncing?: boolean;
  statsData?: StatsRingDataItem[];
}

export function ExportHeader({
  onSync,
  isSyncing = false,
  statsData = [],
}: ExportHeaderProps) {
  const isSyncEnabled = typeof onSync === 'function';
  const hasStats = statsData.length > 0;

  return (
    <Group
      justify={{ base: 'center', md: 'space-between' }}
      align="flex-start"
      gap="md"
      wrap="wrap"
    >
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
        <DownloadAsButton />
      </Group>
      {hasStats ? (
        <Box
          w={{ base: '100%', md: 'auto' }}
          maw={{ base: '100%', md: 320 }}
          miw={{ md: 260 }}
          style={{ flex: '1 1 0%' }}
        >
          <StatsRing data={statsData} />
        </Box>
      ) : null}
    </Group>
  );
}
