import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Center,
  Chip,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule, useSuperScoutFields } from '@/api';

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

type StartingPosition = 'LEFT' | 'CENTER' | 'RIGHT' | 'NO_SHOW';

interface TeamInputState {
  startingPosition: StartingPosition | null;
  cannedComments: string[];
  notes: string;
}

const STARTING_POSITION_OPTIONS: { label: string; value: StartingPosition }[] = [
  { label: 'Left', value: 'LEFT' },
  { label: 'Center', value: 'CENTER' },
  { label: 'Right', value: 'RIGHT' },
  { label: 'No Show', value: 'NO_SHOW' },
];

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
  const {
    data: superScoutFields = [],
    isLoading: isLoadingFields,
    isError: isFieldsError,
  } = useSuperScoutFields();

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

  const [teamInputs, setTeamInputs] = useState<Record<string, TeamInputState>>({});

  useEffect(() => {
    setTeamInputs((current) => {
      const next: Record<string, TeamInputState> = {};

      allianceTeams.forEach((teamNumber, index) => {
        const teamKey = String(teamNumber ?? `slot-${index}`);
        next[teamKey] =
          current[teamKey] ?? {
            startingPosition: null,
            cannedComments: [],
            notes: '',
          };
      });

      return next;
    });
  }, [allianceTeams]);

  const updateTeamInput = (
    teamKey: string,
    updater: (state: TeamInputState) => TeamInputState
  ) => {
    setTeamInputs((current) => {
      const existing =
        current[teamKey] ?? {
          startingPosition: null,
          cannedComments: [],
          notes: '',
        };

      return {
        ...current,
        [teamKey]: updater(existing),
      };
    });
  };

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
  const headerVariant = theme.variantColorResolver({
    theme,
    color: allianceConfig.color,
    variant: 'filled',
  });
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
              {matchLevelLabel} Match {numericMatchNumber}: {allianceConfig.label}
            </Title>
          </Card.Section>
        </Card>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {allianceTeams.map((teamNumber, index) => {
            const teamKey = String(teamNumber ?? `slot-${index}`);
            const teamState = teamInputs[teamKey] ?? {
              startingPosition: null,
              cannedComments: [],
              notes: '',
            };

            return (
              <Card
                key={teamNumber ?? index}
                withBorder
                radius="md"
                shadow="sm"
                bg={surfaceBackground}
              >
                <Stack gap="md" p="md" align="stretch">
                  <Title order={3} c={titleColor}>
                    Team {teamNumber ?? 'TBD'}
                  </Title>
                  <Stack gap={8}>
                    <Text fw={500} c={bodyTextColor}>
                      Starting Position
                    </Text>
                    <Chip.Group
                      multiple={false}
                      value={teamState.startingPosition ?? null}
                      onChange={(value) =>
                        updateTeamInput(teamKey, (state) => ({
                          ...state,
                          startingPosition: (value as StartingPosition | null) ?? null,
                        }))
                      }
                    >
                      <Group gap="xs" wrap="wrap">
                        {STARTING_POSITION_OPTIONS.map((option) => (
                          <Chip key={option.value} value={option.value}>
                            {option.label}
                          </Chip>
                        ))}
                      </Group>
                    </Chip.Group>
                  </Stack>
                  <Stack gap={8}>
                    <Text fw={500} c={bodyTextColor}>
                      Canned Comments
                    </Text>
                    {isLoadingFields ? (
                      <Loader size="sm" />
                    ) : isFieldsError ? (
                      <Text size="sm" c="red.6">
                        Unable to load canned comments.
                      </Text>
                    ) : (
                      <Chip.Group
                        multiple
                        value={teamState.cannedComments}
                        onChange={(value) =>
                          updateTeamInput(teamKey, (state) => ({
                            ...state,
                            cannedComments: value as string[],
                          }))
                        }
                      >
                        <Group gap="xs" wrap="wrap">
                          {superScoutFields.map((field) => (
                            <Chip key={field.key} value={field.key}>
                              {field.label}
                            </Chip>
                          ))}
                        </Group>
                      </Chip.Group>
                    )}
                  </Stack>
                  <Textarea
                    label="Notes"
                    placeholder="Enter any additional observations"
                    minRows={3}
                    value={teamState.notes}
                    onChange={(event) =>
                      updateTeamInput(teamKey, (state) => ({
                        ...state,
                        notes: event.currentTarget.value,
                      }))
                    }
                  />
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
        <Center>
          <Button color={allianceConfig.color} variant="filled">
            Submit Comments
          </Button>
        </Center>
      </Stack>
    </Box>
  );
}
