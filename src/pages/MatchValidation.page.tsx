import { useMemo } from 'react';
import { Box, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';

const formatMatchLevel = (level: string) => level.toUpperCase();
const formatAlliance = (value: string) => value.toUpperCase();

export function MatchValidationPage() {
  const params = useParams({ from: '/dataValidation/matches/$matchLevel/$matchNumber/$alliance' });

  const matchLevelParam = (params.matchLevel ?? '').trim();
  const matchNumberParam = Number.parseInt(params.matchNumber ?? '', 10);
  const allianceParam = (params.alliance ?? '').trim().toUpperCase();

  const hasMatchLevel = matchLevelParam.length > 0;
  const hasMatchNumber = Number.isFinite(matchNumberParam);
  const hasAlliance = allianceParam === 'RED' || allianceParam === 'BLUE';

  const { data: schedule = [], isLoading, isError } = useMatchSchedule();

  const matchEntry = useMemo(() => {
    if (!hasMatchLevel || !hasMatchNumber) {
      return undefined;
    }

    const normalizedLevel = matchLevelParam.toUpperCase();

    return schedule.find(
      (entry) =>
        entry.match_level.toUpperCase() === normalizedLevel &&
        entry.match_number === matchNumberParam
    );
  }, [hasMatchLevel, hasMatchNumber, matchLevelParam, matchNumberParam, schedule]);

  const allianceTeams = useMemo(() => {
    if (!matchEntry || !hasAlliance) {
      return [];
    }

    if (allianceParam === 'RED') {
      return [matchEntry.red1_id, matchEntry.red2_id, matchEntry.red3_id];
    }

    return [matchEntry.blue1_id, matchEntry.blue2_id, matchEntry.blue3_id];
  }, [allianceParam, hasAlliance, matchEntry]);

  if (!hasMatchLevel || !hasMatchNumber || !hasAlliance) {
    return (
      <Box p="md">
        <Text c="red.6" fw={500}>
          The match details provided are incomplete. Please return to the Data Validation table and
          try again.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p="md">
        <Loader />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p="md">
        <Text c="red.6" fw={500}>
          Unable to load the match schedule. Please try again later.
        </Text>
      </Box>
    );
  }

  if (!matchEntry) {
    return (
      <Box p="md">
        <Text fw={500}>We couldn't find that match in the schedule.</Text>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Match Validation</Title>
        <Text>Match Level: {formatMatchLevel(matchLevelParam)}</Text>
        <Text>Match Number: {matchNumberParam}</Text>
        <Text>Alliance: {formatAlliance(allianceParam)}</Text>
        <Text>Teams: {allianceTeams.join(', ')}</Text>
      </Stack>
    </Box>
  );
}
