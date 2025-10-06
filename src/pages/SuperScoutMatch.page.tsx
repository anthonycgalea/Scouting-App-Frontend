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
  useMantineTheme,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';

const ALLIANCE_CONFIG = {
  red: {
    label: 'Red Alliance',
    color: 'red',
  },
  blue: {
    label: 'Blue Alliance',
    color: 'blue',
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
  const theme = useMantineTheme();
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

  const pageBackground = isDark ? theme.colors.dark[7] : theme.white;
  const surfaceBackground = isDark ? theme.colors.dark[6] : theme.white;
  const headerVariant = theme.fn.variant({ color: allianceConfig.color, variant: 'filled' });
  const headerBackground = headerVariant?.background ?? theme.colors[allianceConfig.color][
    isDark ? 9 : 6
  ];
  const headerTextColor = headerVariant?.color ?? theme.white;
  const bodyTextColor = isDark ? theme.colors.gray[2] : theme.colors.gray[7];
  const titleColor = isDark ? theme.colors.gray[0] : theme.colors.gray[9];

  return (
    <Box p="md" bg={pageBackground} mih="100%">
      <Stack gap="lg">
        <Card withBorder radius="md" shadow="sm" bg={surfaceBackground}>
          <Card.Section bg={headerBackground} inheritPadding py="md">
            <Title order={2} c={headerTextColor} ta="center">
              {allianceConfig.label}
            </Title>
          </Card.Section>
          <Stack gap={4} p="md" align="center">
            <Text fw={500} c={bodyTextColor} ta="center">
              {matchLevelLabel} Match {numericMatchNumber}
            </Text>
          </Stack>
        </Card>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {allianceTeams.map((teamNumber, index) => (
            <Card
              key={teamNumber ?? index}
              withBorder
              radius="md"
              shadow="sm"
              bg={surfaceBackground}
            >
              <Stack gap="sm" align="center" p="md">
                <Title order={3} c={titleColor}>
                  Team {teamNumber ?? 'TBD'}
                </Title>
                <Text size="sm" c={bodyTextColor} ta="center">
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
