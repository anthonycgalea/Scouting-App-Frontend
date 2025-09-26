import { lazy, Suspense, useMemo, useState } from 'react';
import { ActionIcon, Box, Group, Loader, Skeleton, Stack } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useMatchSchedule, useTeamMatchValidation, syncScoutingData } from '@/api';
import { DataManager } from '@/components/DataManager/DataManager';
import { StatsRing } from '@/components/StatsRing/StatsRing';

const TEAMS_PER_MATCH = 6;

const isQualificationMatch = (matchLevel?: string | null) =>
  (matchLevel ?? '').trim().toLowerCase() === 'qm';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

export function DataValidationPage() {
  const { data: scheduleData = [] } = useMatchSchedule();
  const { data: validationData = [] } = useTeamMatchValidation();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      await syncScoutingData();
      window.location.reload();
    } catch (error) {
      setIsSyncing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to sync scouting data', error);
    }
  };

  const statsData = useMemo(() => {
    const qualificationMatches = scheduleData.filter((match) =>
      isQualificationMatch(match.match_level)
    );
    const totalQualificationMatches = qualificationMatches.length;
    const totalPossibleRecords = totalQualificationMatches * TEAMS_PER_MATCH;

    const qualificationValidation = validationData.filter((entry) =>
      isQualificationMatch(entry.match_level)
    );
    const totalQualificationRecords = qualificationValidation.length;
    const validatedQualificationRecords = qualificationValidation.filter(
      (entry) => entry.validation_status === 'VALID'
    ).length;

    return [
      {
        label: 'Team Matches Scouted',
        current: totalQualificationRecords,
        total: totalPossibleRecords,
        color: 'yellow.6',
      },
      {
        label: 'Matches Validated',
        current: validatedQualificationRecords,
        total: totalPossibleRecords,
        color: 'green.6',
      },
    ];
  }, [scheduleData, validationData]);

  return (
    <Box p="sm">
      <Stack gap="md">
        <Suspense
          fallback={
            <Group justify="center" align="center" gap="sm">
              <Skeleton height={34} width={200} radius="sm" />
              <Skeleton height={36} width={36} radius="md" />
            </Group>
          }
        >
          <Group justify="center" align="center" gap="sm">
            <EventHeader pageInfo="Data Validation" />
            <ActionIcon
              aria-label="Sync data validation"
              size="lg"
              radius="md"
              variant="default"
              style={{ backgroundColor: 'var(--mantine-color-body)' }}
              onClick={handleSyncData}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader size="sm" /> : <IconRefresh size={20} />}
            </ActionIcon>
          </Group>
        </Suspense>
        <Box pos="relative">
          <Box pos="absolute" top={0} right={0} p={{ base: 'md', sm: 'sm' }}>
            <StatsRing data={statsData} />
          </Box>
          <DataManager />
        </Box>
      </Stack>
    </Box>
  );
}
