import { useMemo } from 'react';
import {
  Box,
  Card,
  Center,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';

const ALLIANCE_CONFIG = {
  red: {
    label: 'Red Alliance',
    background: { light: 'red.0', dark: 'red.9' },
    cardBackground: { light: 'red.1', dark: 'red.8' },
    headerColor: { light: 'red.8', dark: 'red.2' },
  },
  blue: {
    label: 'Blue Alliance',
    background: { light: 'blue.0', dark: 'blue.9' },
    cardBackground: { light: 'blue.1', dark: 'blue.8' },
    headerColor: { light: 'blue.8', dark: 'blue.1' },
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
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

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

  const backgroundColor = isDark
    ? allianceConfig.background.dark
    : allianceConfig.background.light;
  const cardBackgroundColor = isDark
    ? allianceConfig.cardBackground.dark
    : allianceConfig.cardBackground.light;
  const headerColor = isDark
    ? allianceConfig.headerColor.dark
    : allianceConfig.headerColor.light;

  return (
    <Box p="md" bg={backgroundColor} mih="100%">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2} c={headerColor} ta="center">
            {allianceConfig.label}
          </Title>
          <Text ta="center" fw={500} c={isDark ? 'gray.0' : undefined}>
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
              bg={cardBackgroundColor}
            >
              <Stack gap="sm" align="center">
                <Title order={3} c={headerColor}>
                  Team {teamNumber ?? 'TBD'}
                </Title>
                <Text size="sm" c={isDark ? 'gray.2' : 'dimmed'} ta="center">
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
