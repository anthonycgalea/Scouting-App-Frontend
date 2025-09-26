import { useMemo } from 'react';
import { Box } from '@mantine/core';
import { useMatchSchedule, useTeamMatchValidation } from '@/api';
import { DataManager } from '@/components/DataManager/DataManager';
import { StatsRing } from '@/components/StatsRing/StatsRing';

const TEAMS_PER_MATCH = 6;

const isQualificationMatch = (matchLevel?: string | null) =>
  (matchLevel ?? '').trim().toLowerCase() === 'qm';

export function DataValidationPage() {
  const { data: scheduleData = [] } = useMatchSchedule();
  const { data: validationData = [] } = useTeamMatchValidation();

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
      <Box pos="relative">
        <Box pos="absolute" top={0} right={0} p={{ base: 'md', sm: 'sm' }}>
          <StatsRing data={statsData} />
        </Box>
        <DataManager />
      </Box>
    </Box>
  );
}
