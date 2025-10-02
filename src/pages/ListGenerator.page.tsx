import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Box,
  Card,
  Flex,
  Group,
  ScrollArea,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import { usePickListGenerators } from '@/api/pickLists';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

import { PickListGeneratorSelector } from '@/components/PickListGenerators/PickListGeneratorSelector';
import { WeightSlider } from '@/components/PickListGenerators/WeightSlider';

const BASE_GENERATOR_FIELDS = new Set([
  'id',
  'season',
  'organization_id',
  'title',
  'notes',
  'timestamp',
  'favorited',
  'created',
  'last_updated',
]);

const WEIGHT_LABELS_BY_SEASON: Record<number, Record<string, string>> = {
  0: {
    al4c: 'Autonomous Level 4 Coral',
    al3c: 'Autonomous Level 3 Coral',
    al2c: 'Autonomous Level 2 Coral',
    al1c: 'Autonomous Level 1 Coral',
    autonomous_coral: 'Autonomous Coral',
    autonomous_algae: 'Autonomous Algae',
    autonomous_points: 'Autonomous Points',
    tl4c: 'Teleop Level 4 Coral',
    tl3c: 'Teleop Level 3 Coral',
    tl2c: 'Teleop Level 2 Coral',
    tl1c: 'Teleop Level 1 Coral',
    teleop_coral: 'Teleop Coral',
    teleop_algae: 'Teleop Algae',
    teleop_points: 'Teleop Points',
    aNet: 'Autonomous Net Algae',
    tNet: 'Teleop Net Algae',
    aProcessor: 'Autonomous Processor Algae',
    tProcessor: 'Teleop Processor Algae',
    endgame_points: 'Endgame Points',
    total_coral: 'Total Coral',
    total_algae: 'Total Algae',
    total_game_pieces: 'Total Game Pieces',
    total_points: 'Total Points',
  },
  2025: {
    al4c: 'Autonomous Level 4 Coral',
    al3c: 'Autonomous Level 3 Coral',
    al2c: 'Autonomous Level 2 Coral',
    al1c: 'Autonomous Level 1 Coral',
    autonomous_coral: 'Autonomous Coral',
    autonomous_algae: 'Autonomous Algae',
    autonomous_points: 'Autonomous Points',
    tl4c: 'Teleop Level 4 Coral',
    tl3c: 'Teleop Level 3 Coral',
    tl2c: 'Teleop Level 2 Coral',
    tl1c: 'Teleop Level 1 Coral',
    teleop_coral: 'Teleop Coral',
    teleop_algae: 'Teleop Algae',
    teleop_points: 'Teleop Points',
    aNet: 'Autonomous Net Algae',
    tNet: 'Teleop Net Algae',
    aProcessor: 'Autonomous Processor Algae',
    tProcessor: 'Teleop Processor Algae',
    endgame_points: 'Endgame Points',
    total_coral: 'Total Coral',
    total_algae: 'Total Algae',
    total_game_pieces: 'Total Game Pieces',
    total_points: 'Total Points',
  },
};

const SEASON_YEAR_LABELS: Record<number, string> = {
  0: '2025',
  2025: '2025',
};

const formatWeightKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatSeasonLabel = (season: number) =>
  SEASON_YEAR_LABELS[season] ?? (season >= 1900 ? `${season}` : `Season ${season}`);

export function ListGeneratorPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const { data: generators, isLoading } = usePickListGenerators({ enabled: canAccessOrganizationPages });

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [hasInitializedSeason, setHasInitializedSeason] = useState(false);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string | null>(null);
  const [weightsDraft, setWeightsDraft] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!generators || generators.length === 0) {
      setSelectedSeason(null);
      setHasInitializedSeason(false);
      return;
    }

    const sortedSeasons = Array.from(new Set(generators.map((generator) => generator.season))).sort(
      (a, b) => b - a,
    );

    if (!hasInitializedSeason) {
      const [firstSeason] = sortedSeasons;

      if (firstSeason !== undefined) {
        setSelectedSeason(`${firstSeason}`);
        setHasInitializedSeason(true);
      }

      return;
    }

    if (selectedSeason) {
      const parsedSelectedSeason = Number.parseInt(selectedSeason, 10);

      if (!sortedSeasons.includes(parsedSelectedSeason)) {
        const [firstSeason] = sortedSeasons;
        setSelectedSeason(firstSeason !== undefined ? `${firstSeason}` : null);
      }
    }
  }, [generators, hasInitializedSeason, selectedSeason]);

  useEffect(() => {
    if (selectedSeason) {
      setHasInitializedSeason(true);
    }
  }, [selectedSeason]);

  const filteredGenerators = useMemo(() => {
    if (!generators || generators.length === 0) {
      return [];
    }

    if (!selectedSeason) {
      return generators;
    }

    const parsedSeason = Number.parseInt(selectedSeason, 10);

    return generators.filter((generator) => generator.season === parsedSeason);
  }, [generators, selectedSeason]);

  useEffect(() => {
    if (filteredGenerators.length === 0) {
      setSelectedGeneratorId(null);
      return;
    }

    if (!selectedGeneratorId) {
      setSelectedGeneratorId(filteredGenerators[0].id);
    } else if (!filteredGenerators.some((generator) => generator.id === selectedGeneratorId)) {
      setSelectedGeneratorId(filteredGenerators[0].id);
    }
  }, [filteredGenerators, selectedGeneratorId]);

  const selectedGenerator = useMemo(
    () => filteredGenerators.find((generator) => generator.id === selectedGeneratorId) ?? null,
    [filteredGenerators, selectedGeneratorId],
  );

  useEffect(() => {
    if (!selectedGenerator) {
      setWeightsDraft({});
      return;
    }

    const draftEntries = Object.entries(selectedGenerator)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .filter(([key]) => !BASE_GENERATOR_FIELDS.has(key));

    setWeightsDraft(
      draftEntries.reduce<Record<string, number>>((accumulator, [key, value]) => {
        accumulator[key] = value;
        return accumulator;
      }, {}),
    );
  }, [selectedGenerator]);

  const selectedSeasonNumber = selectedSeason ? Number.parseInt(selectedSeason, 10) : null;
  const weightLabels = useMemo(
    () => (selectedSeasonNumber != null ? WEIGHT_LABELS_BY_SEASON[selectedSeasonNumber] ?? {} : {}),
    [selectedSeasonNumber],
  );

  const seasonOptions = useMemo(() => {
    if (!generators) {
      return [];
    }

    const seasons = Array.from(new Set(generators.map((generator) => generator.season))).sort((a, b) => b - a);

    return seasons.map((season) => ({
      value: `${season}`,
      label: formatSeasonLabel(season),
    }));
  }, [generators]);

  const weightFields = useMemo(() => {
    const entries = Object.entries(weightsDraft);

    return entries.sort((a, b) => {
      const labelA = (weightLabels[a[0]] ?? formatWeightKey(a[0])).toLowerCase();
      const labelB = (weightLabels[b[0]] ?? formatWeightKey(b[0])).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [weightsDraft, weightLabels]);

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md" h="100%">
      <Stack gap="lg" h="100%">
        <Group align="center" justify="space-between" wrap="wrap" gap="sm">
          <Title order={2}>Pick List Generators</Title>
          <Select
            placeholder="Select season"
            data={seasonOptions}
            value={selectedSeason}
            onChange={setSelectedSeason}
            clearable
            searchable={seasonOptions.length > 6}
            disabled={seasonOptions.length === 0}
            w={{ base: '100%', sm: '240px' }}
          />
        </Group>

        <Flex direction={{ base: 'column', md: 'row' }} gap="md" style={{ flex: 1, minHeight: 0 }}>
          <Card withBorder padding="lg" radius="md" style={{ flex: 4, display: 'flex', minHeight: 0 }}>
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              {selectedGenerator ? (
                <>
                  <Stack gap="xs">
                    <Group gap="xs" justify="space-between" align="flex-start" wrap="wrap">
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} size="lg" lineClamp={2}>
                          {selectedGenerator.title}
                        </Text>
                        <Text c="dimmed" size="sm">
                          Last updated{' '}
                          {new Date(selectedGenerator.timestamp).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Text>
                      </Stack>
                      <Badge variant="light" color="blue">
                        {selectedSeasonNumber != null
                          ? formatSeasonLabel(selectedSeasonNumber)
                          : formatSeasonLabel(selectedGenerator.season)}
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="sm">
                      Configure how this generator scores each attribute using the weights panel.
                    </Text>
                  </Stack>

                  <Stack gap="sm">
                    <Title order={4}>Notes</Title>
                    {selectedGenerator.notes ? (
                      <Text>{selectedGenerator.notes}</Text>
                    ) : (
                      <Text c="dimmed">No notes have been added for this generator.</Text>
                    )}
                  </Stack>
                </>
              ) : isLoading ? (
                <Text c="dimmed">Loading pick list generators…</Text>
              ) : (
                <Text c="dimmed">Select a pick list generator to view its details.</Text>
              )}
            </Stack>
          </Card>

          <Card withBorder padding="lg" radius="md" style={{ flex: 2, display: 'flex', minHeight: 0 }}>
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Weights</Title>
              {selectedGenerator ? (
                weightFields.length > 0 ? (
                  <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                    <Stack gap="md" py="xs">
                      {weightFields.map(([key, value]) => (
                        <WeightSlider
                          key={key}
                          label={weightLabels[key] ?? formatWeightKey(key)}
                          value={value}
                          onChange={(nextValue) => {
                            setWeightsDraft((current) => ({
                              ...current,
                              [key]: nextValue,
                            }));
                          }}
                        />
                      ))}
                    </Stack>
                  </ScrollArea>
                ) : (
                  <Text c="dimmed">This generator does not expose any adjustable weights.</Text>
                )
              ) : (
                <Text c="dimmed">Select a pick list generator to configure its weights.</Text>
              )}
            </Stack>
          </Card>

          <Card withBorder padding="lg" radius="md" style={{ flex: 2, display: 'flex', minHeight: 0 }}>
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Pick List Generators</Title>
              {isLoading ? (
                <Text c="dimmed">Loading pick list generators…</Text>
              ) : filteredGenerators.length === 0 ? (
                <Text c="dimmed">
                  {seasonOptions.length > 0
                    ? 'There are no pick list generators for the selected season yet.'
                    : 'You do not have any pick list generators yet.'}
                </Text>
              ) : (
                <>
                  {selectedSeasonNumber != null && (
                    <Text c="dimmed" size="sm">
                      Showing generators for {formatSeasonLabel(selectedSeasonNumber)}.
                    </Text>
                  )}
                  <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                    <PickListGeneratorSelector
                      generators={filteredGenerators}
                      selectedGeneratorId={selectedGeneratorId}
                      onSelectGenerator={(generatorId) => setSelectedGeneratorId(generatorId)}
                    />
                  </ScrollArea>
                  <Text c="dimmed" size="sm">
                    Click a generator to load it in the manager on the left.
                  </Text>
                </>
              )}
            </Stack>
          </Card>
        </Flex>
      </Stack>
    </Box>
  );
}
