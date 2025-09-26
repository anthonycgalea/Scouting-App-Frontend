import { type ReactNode, useMemo } from 'react';
import { Box, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule, useScoutMatch } from '@/api';

interface TeamMatchDataCardProps {
  matchNumber: number;
  matchLevel: string;
  teamNumber: number;
}

function TeamMatchDataCard({ matchNumber, matchLevel, teamNumber }: TeamMatchDataCardProps) {
  const {
    data: matchData,
    isLoading,
    isError,
  } = useScoutMatch({ matchNumber, matchLevel, teamNumber });

  let content: ReactNode;

  if (isLoading) {
    content = <Loader size="sm" />;
  } else if (isError) {
    content = (
      <Text c="red.6" fz="sm">
        Unable to load scouting data for this team.
      </Text>
    );
  } else {
    const jsonText = JSON.stringify(matchData ?? {}, null, 2);

    content = (
      <Text
        component="pre"
        fz="xs"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}
      >
        {jsonText}
      </Text>
    );
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="xs">
        <Text fw={500}>Team {teamNumber}</Text>
        {content}
      </Stack>
    </Paper>
  );
}

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
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>Match Validation</Title>
          <Text>Match Level: {formatMatchLevel(matchLevelParam)}</Text>
          <Text>Match Number: {matchNumberParam}</Text>
          <Text>Alliance: {formatAlliance(allianceParam)}</Text>
          <Text>Teams: {allianceTeams.join(', ')}</Text>
        </Stack>

        <Stack gap="sm">
          <Title order={3}>Scouting Data</Title>
          {allianceTeams.length === 0 ? (
            <Text c="dimmed">No teams were found for this alliance.</Text>
          ) : (
            allianceTeams.map((teamNumber) => (
              <TeamMatchDataCard
                key={teamNumber}
                matchNumber={matchEntry.match_number}
                matchLevel={matchEntry.match_level}
                teamNumber={teamNumber}
              />
            ))
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
