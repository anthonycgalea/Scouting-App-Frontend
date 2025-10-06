import { useMemo } from 'react';
import { Box, Card, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';

const ALLIANCE_CONFIG = {
  red: {
    label: 'Red Alliance',
    background: 'red.0',
    cardBackground: 'red.1',
    headerColor: 'red.8',
  },
  blue: {
    label: 'Blue Alliance',
    background: 'blue.0',
    cardBackground: 'blue.1',
    headerColor: 'blue.8',
  },
} as const;

type AllianceKey = keyof typeof ALLIANCE_CONFIG;

export function SuperScoutMatchPage() {
  const { matchLevel, matchNumber, alliance } = useParams({
    from: '/superScout/match/$matchLevel/$matchNumber/$alliance',
  });
  const numericMatchNumber = Number.parseInt(matchNumber ?? '', 10);
  const normalizedAlliance = (alliance ?? '').toLowerCase() as AllianceKey | undefined;
  const allianceConfig = normalizedAlliance ? ALLIANCE_CONFIG[normalizedAlliance] : undefined;

  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();

  const match = useMemo(() => {
    if (!matchLevel || Number.isNaN(numericMatchNumber)) {
      return undefined;
    }

    const normalizedLevel = matchLevel.toLowerCase();

    return scheduleData.find(
      (entry) =>
        entry.match_level?.toLowerCase() === normalizedLevel &&
        entry.match_number === numericMatchNumber
    );
  }, [matchLevel, numericMatchNumber, scheduleData]);

  const allianceTeams = useMemo(() => {
    if (!match || !normalizedAlliance) {
      return [];
    }

    if (normalizedAlliance === 'red') {
      return [match.red1_id, match.red2_id, match.red3_id];
    }

    if (normalizedAlliance === 'blue') {
      return [match.blue1_id, match.blue2_id, match.blue3_id];
    }

    return [];
  }, [match, normalizedAlliance]);

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center mih={200}>
        <Text c="red.6" fw={500}>
          Unable to load the match schedule.
        </Text>
      </Center>
    );
  }

  if (!matchLevel || Number.isNaN(numericMatchNumber) || !normalizedAlliance || !allianceConfig) {
    return (
      <Center mih={200}>
        <Text fw={500}>Invalid match information provided.</Text>
      </Center>
    );
  }

  if (!match) {
    return (
      <Center mih={200}>
        <Text fw={500}>Match not found.</Text>
      </Center>
    );
  }

  const matchLevelLabels: Record<string, string> = {
    qm: 'Qualification',
    sf: 'Playoff',
    f: 'Finals',
  };

  const matchLevelLabel =
    matchLevelLabels[match.match_level?.toLowerCase() ?? matchLevel.toLowerCase()] ?? matchLevel;

  return (
    <Box p="md" bg={allianceConfig.background} mih="100%">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2} c={allianceConfig.headerColor} ta="center">
            {allianceConfig.label}
          </Title>
          <Text ta="center" fw={500}>
            {matchLevelLabel} Match {numericMatchNumber}
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {allianceTeams.map((teamNumber, index) => (
            <Card
              key={teamNumber ?? index}
              withBorder
              radius="md"
              shadow="sm"
              bg={allianceConfig.cardBackground}
            >
              <Stack gap="sm" align="center">
                <Title order={3} c={allianceConfig.headerColor}>
                  Team {teamNumber ?? 'TBD'}
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  Scouting inputs will appear here.
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
