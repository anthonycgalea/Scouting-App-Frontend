import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  ActionIcon,
  Button,
  Badge,
  Box,
  Card,
  Flex,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconStar, IconStarFilled } from '@tabler/icons-react';

import {
  useCreatePickListGenerator,
  useDeletePickListGenerator,
  usePickListGenerators,
  useUpdatePickListGenerator,
  type CreatePickListGeneratorRequest,
} from '@/api/pickLists';
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

const DEFAULT_SEASON_ID = 1;

const REEFSCAPE_WEIGHT_LABELS = {
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
} as const;

const WEIGHT_LABELS_BY_SEASON: Record<number, Record<string, string>> = {
  0: REEFSCAPE_WEIGHT_LABELS,
  [DEFAULT_SEASON_ID]: REEFSCAPE_WEIGHT_LABELS,
  2025: REEFSCAPE_WEIGHT_LABELS,
};

const SEASON_LABELS: Record<number, string> = {
  0: '2025: REEFSCAPE',
  [DEFAULT_SEASON_ID]: '2025: REEFSCAPE',
  2025: '2025: REEFSCAPE',
};

const formatWeightKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatSeasonLabel = (season: number) =>
  SEASON_LABELS[season] ?? (season >= 1900 ? `${season}` : `Season ${season}`);

export function ListGeneratorPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const { data: generators, isLoading } = usePickListGenerators({ enabled: canAccessOrganizationPages });
  const createGeneratorMutation = useCreatePickListGenerator();
  const updateGeneratorMutation = useUpdatePickListGenerator();
  const deleteGeneratorMutation = useDeletePickListGenerator();

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [hasInitializedSeason, setHasInitializedSeason] = useState(false);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string | null>(null);
  const [weightsDraft, setWeightsDraft] = useState<Record<string, number>>({});
  const [savedWeightsSnapshot, setSavedWeightsSnapshot] = useState<Record<string, number>>({});
  const [configuredWeightKeys, setConfiguredWeightKeys] = useState<Set<string>>(new Set());
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [createGeneratorTitle, setCreateGeneratorTitle] = useState('');
  const [createGeneratorNotes, setCreateGeneratorNotes] = useState('');
  const [generatorTitleDraft, setGeneratorTitleDraft] = useState('');
  const [generatorNotesDraft, setGeneratorNotesDraft] = useState('');
  const [generatorDetailsSnapshot, setGeneratorDetailsSnapshot] = useState({ title: '', notes: '' });
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [editDetailsModalOpened, { open: openEditDetailsModal, close: closeEditDetailsModal }] =
    useDisclosure(false);

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
      if (sortedSeasons.includes(DEFAULT_SEASON_ID)) {
        setSelectedSeason(`${DEFAULT_SEASON_ID}`);
        setHasInitializedSeason(true);
        return;
      }

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
      setConfiguredWeightKeys(new Set());
      setSavedWeightsSnapshot({});
      setGeneratorTitleDraft('');
      setGeneratorNotesDraft('');
      setGeneratorDetailsSnapshot({ title: '', notes: '' });
      return;
    }

    const draftEntries = Object.entries(selectedGenerator)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .filter(([key]) => !BASE_GENERATOR_FIELDS.has(key));

    const nextWeights = draftEntries.reduce<Record<string, number>>((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {});

    setWeightsDraft(nextWeights);
    setSavedWeightsSnapshot(nextWeights);
    setConfiguredWeightKeys(
      new Set(draftEntries.filter(([, value]) => value > 0).map(([key]) => key)),
    );
    setGeneratorTitleDraft(selectedGenerator.title);
    setGeneratorNotesDraft(selectedGenerator.notes ?? '');
    setGeneratorDetailsSnapshot({
      title: selectedGenerator.title,
      notes: selectedGenerator.notes ?? '',
    });
  }, [selectedGenerator]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedGenerator) {
      return false;
    }

    const keys = new Set([
      ...Object.keys(savedWeightsSnapshot),
      ...Object.keys(weightsDraft),
    ]);

    const hasTitleChanges = generatorTitleDraft !== generatorDetailsSnapshot.title;
    const hasNotesChanges = generatorNotesDraft !== generatorDetailsSnapshot.notes;

    if (hasTitleChanges || hasNotesChanges) {
      return true;
    }

    for (const key of keys) {
      const originalValue = savedWeightsSnapshot[key] ?? 0;
      const draftValue = weightsDraft[key] ?? 0;

      if (Math.abs(originalValue - draftValue) > 1e-6) {
        return true;
      }
    }

    return false;
  }, [
    generatorDetailsSnapshot,
    generatorNotesDraft,
    generatorTitleDraft,
    savedWeightsSnapshot,
    selectedGenerator,
    weightsDraft,
  ]);

  const selectedSeasonNumber = selectedSeason ? Number.parseInt(selectedSeason, 10) : null;
  const weightLabels = useMemo(
    () => (selectedSeasonNumber != null ? WEIGHT_LABELS_BY_SEASON[selectedSeasonNumber] ?? {} : {}),
    [selectedSeasonNumber],
  );

  const trimmedSelectedGeneratorNotes = generatorNotesDraft.trim();
  const hasSelectedGeneratorNotes = trimmedSelectedGeneratorNotes.length > 0;
  const selectedGeneratorSeasonLabel =
    selectedGenerator != null
      ? formatSeasonLabel(
          selectedSeasonNumber != null ? selectedSeasonNumber : selectedGenerator.season,
        )
      : null;

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

  const activeWeightFields = useMemo(
    () => weightFields.filter(([key]) => configuredWeightKeys.has(key)),
    [weightFields, configuredWeightKeys],
  );

  const availableWeightFields = useMemo(
    () => weightFields.filter(([key]) => !configuredWeightKeys.has(key)),
    [weightFields, configuredWeightKeys],
  );

  const handleAddWeight = useCallback((key: string) => {
    setWeightsDraft((current) => ({
      ...current,
      [key]: 0.1,
    }));
    setConfiguredWeightKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  const handleRemoveWeight = useCallback((key: string) => {
    setWeightsDraft((current) => ({
      ...current,
      [key]: 0,
    }));
    setConfiguredWeightKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setCreateGeneratorTitle('');
    setCreateGeneratorNotes('');
    setCreateModalOpened(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setCreateModalOpened(false);
  }, []);

  const handleCancelEditDetails = useCallback(() => {
    setGeneratorTitleDraft(generatorDetailsSnapshot.title);
    setGeneratorNotesDraft(generatorDetailsSnapshot.notes);
    closeEditDetailsModal();
  }, [closeEditDetailsModal, generatorDetailsSnapshot]);

  const handleConfirmEditDetails = useCallback(() => {
    const trimmedTitle = generatorTitleDraft.trim();

    if (!trimmedTitle) {
      notifications.show({
        color: 'red',
        title: 'Unable to update generator details',
        message: 'A title is required to update the pick list generator.',
      });
      return;
    }

    const trimmedNotes = generatorNotesDraft.trim();

    setGeneratorTitleDraft(trimmedTitle);
    setGeneratorNotesDraft(trimmedNotes);
    closeEditDetailsModal();
  }, [
    closeEditDetailsModal,
    generatorNotesDraft,
    generatorTitleDraft,
  ]);

  const handleSubmitCreateGenerator = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = createGeneratorTitle.trim();
      const trimmedNotes = createGeneratorNotes.trim();

      if (!trimmedTitle) {
        notifications.show({
          color: 'red',
          title: 'Unable to create generator',
          message: 'A title is required to create a pick list generator.',
        });
        return;
      }

      try {
        const payload: CreatePickListGeneratorRequest = {
          title: trimmedTitle,
          notes: trimmedNotes,
        };

        const createdGenerator = await createGeneratorMutation.mutateAsync(payload);

        notifications.show({
          color: 'green',
          title: 'Generator created',
          message: `Created “${trimmedTitle}”.`,
        });

        setSelectedSeason(`${createdGenerator.season}`);
        setSelectedGeneratorId(createdGenerator.id);
        setCreateModalOpened(false);
      } catch (error) {
        notifications.show({
          color: 'red',
          title: 'Unable to create generator',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while creating the pick list generator.',
        });
      }
    },
    [
      createGeneratorMutation,
      createGeneratorTitle,
      createGeneratorNotes,
      setSelectedSeason,
      setSelectedGeneratorId,
    ],
  );

  const handleSaveGeneratorChanges = useCallback(async () => {
    if (!selectedGenerator || !hasUnsavedChanges) {
      return;
    }

    const trimmedTitle = generatorTitleDraft.trim();

    if (!trimmedTitle) {
      notifications.show({
        color: 'red',
        title: 'Unable to save changes',
        message: 'A title is required to update the pick list generator.',
      });
      return;
    }

    const trimmedNotes = generatorNotesDraft.trim();

    const payloadWeights = Array.from(
      new Set([
        ...Object.keys(savedWeightsSnapshot),
        ...Object.keys(weightsDraft),
      ]),
    ).reduce<Record<string, number>>((accumulator, key) => {
      const value = weightsDraft[key] ?? 0;
      accumulator[key] = Number.isFinite(value) ? Number(value) : 0;
      return accumulator;
    }, {});

    try {
      await updateGeneratorMutation.mutateAsync({
        generator: {
          ...selectedGenerator,
          title: trimmedTitle,
          notes: trimmedNotes,
          ...payloadWeights,
        },
      });

      setSavedWeightsSnapshot(payloadWeights);
      setGeneratorDetailsSnapshot({ title: trimmedTitle, notes: trimmedNotes });
      setGeneratorTitleDraft(trimmedTitle);
      setGeneratorNotesDraft(trimmedNotes);
      notifications.show({
        color: 'green',
        title: 'Generator updated',
        message: `Saved changes to “${trimmedTitle}”.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to save changes',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while updating the pick list generator.',
      });
    }
  }, [
    generatorNotesDraft,
    generatorTitleDraft,
    hasUnsavedChanges,
    savedWeightsSnapshot,
    selectedGenerator,
    updateGeneratorMutation,
    weightsDraft,
  ]);

  const handleConfirmDeleteGenerator = useCallback(async () => {
    if (!selectedGenerator) {
      return;
    }

    const generatorId = selectedGenerator.id;
    const generatorTitle = selectedGenerator.title;

    try {
      await deleteGeneratorMutation.mutateAsync({ id: generatorId });
      setSelectedGeneratorId((current) => (current === generatorId ? null : current));
      closeDeleteModal();

      notifications.show({
        color: 'green',
        title: 'Generator deleted',
        message: `Deleted “${generatorTitle}”.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to delete generator',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while deleting the pick list generator.',
      });
    }
  }, [
    closeDeleteModal,
    deleteGeneratorMutation,
    selectedGenerator,
    setSelectedGeneratorId,
  ]);

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md" h="100%">
      <Stack gap="lg" h="100%">
        <Group align="center" justify="space-between" wrap="wrap" gap="sm">
          <Title order={2}>Pick List Generators</Title>
          <Group gap="xs" wrap="wrap" justify="flex-end">
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
            <Button leftSection={<IconPlus stroke={1.5} size={16} />} onClick={handleOpenCreateModal}>
              Create Generator
            </Button>
          </Group>
        </Group>

        <Flex direction={{ base: 'column', md: 'row' }} gap="md" style={{ flex: 1, minHeight: 0 }}>
          <Card withBorder padding="lg" radius="md" style={{ flex: 4, display: 'flex', minHeight: 0 }}>
            <Flex direction="column" gap="md" style={{ flex: 1, minHeight: 0 }}>
              <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                {selectedGenerator ? (
                  <>
                    <Stack gap="xs">
                      <Group gap="xs" justify="space-between" align="flex-start" wrap="wrap">
                      <Group
                        gap="xs"
                        align="center"
                        wrap="wrap"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <Tooltip
                          label={
                            selectedGenerator.favorited
                              ? 'Favorited generator'
                              : 'Generator not favorited'
                          }
                          withinPortal
                        >
                          <Box
                            component="span"
                            role="img"
                            aria-label={
                              selectedGenerator.favorited
                                ? 'Generator is favorited'
                                : 'Generator is not favorited'
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              color: selectedGenerator.favorited
                                ? 'var(--mantine-color-yellow-6)'
                                : 'var(--mantine-color-dimmed)',
                              cursor: 'default',
                            }}
                          >
                            {selectedGenerator.favorited ? (
                              <IconStarFilled size={18} />
                            ) : (
                              <IconStar size={18} />
                            )}
                          </Box>
                        </Tooltip>
                        <Text
                          fw={600}
                          size="lg"
                          lineClamp={2}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          {selectedGenerator.title}
                        </Text>
                        {selectedGeneratorSeasonLabel && (
                          <Badge variant="light" color="blue" style={{ flexShrink: 0 }}>
                            {selectedGeneratorSeasonLabel}
                          </Badge>
                        )}
                      </Group>
                      <Group
                        gap="xs"
                        align="center"
                        justify="flex-end"
                        wrap="wrap"
                        style={{ flexShrink: 0 }}
                      >
                        <Text c="dimmed" size="sm" style={{ flexShrink: 0 }}>
                          Last updated{' '}
                          {new Date(selectedGenerator.timestamp).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Text>
                        <Tooltip
                          label={
                            hasSelectedGeneratorNotes
                              ? trimmedSelectedGeneratorNotes
                              : 'Click to add notes for this generator.'
                          }
                          multiline
                          maw={260}
                          withinPortal
                        >
                          <ActionIcon
                            variant="subtle"
                            aria-label={
                              hasSelectedGeneratorNotes
                                ? `Edit generator notes: ${trimmedSelectedGeneratorNotes}`
                                : 'Add notes for this generator'
                            }
                            onClick={openEditDetailsModal}
                            style={{
                              color: hasSelectedGeneratorNotes
                                ? 'var(--mantine-color-green-6)'
                                : 'var(--mantine-color-dimmed)',
                            }}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Stack>
                  <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
                    {activeWeightFields.length > 0 ? (
                      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                        <Stack gap="sm" py="xs">
                          {activeWeightFields.map(([key, value]) => (
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
                              onRemove={() => handleRemoveWeight(key)}
                            />
                          ))}
                        </Stack>
                      </ScrollArea>
                    ) : (
                      <Text c="dimmed">
                        No weights have been configured yet. Use the weights panel to add attributes.
                      </Text>
                    )}
                  </Stack>
                </>
              ) : isLoading ? (
                <Text c="dimmed">Loading pick list generators…</Text>
              ) : (
                <Text c="dimmed">Select a pick list generator to view its details.</Text>
              )}
              </Stack>
              <Group justify="space-between">
                <Button
                  onClick={() => {
                    void handleSaveGeneratorChanges();
                  }}
                  disabled={!selectedGenerator || !hasUnsavedChanges}
                  loading={updateGeneratorMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  color="red"
                  onClick={openDeleteModal}
                  disabled={!selectedGenerator}
                  loading={deleteGeneratorMutation.isPending}
                >
                  Delete Generator
                </Button>
              </Group>
            </Flex>
          </Card>

          <Card withBorder padding="lg" radius="md" style={{ flex: 2, display: 'flex', minHeight: 0 }}>
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Weights</Title>
              {selectedGenerator ? (
                weightFields.length > 0 ? (
                  availableWeightFields.length > 0 ? (
                    <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                      <Stack gap="sm" py="xs">
                        {availableWeightFields.map(([key]) => (
                          <Group key={key} justify="space-between" align="center">
                            <Text fw={500}>{weightLabels[key] ?? formatWeightKey(key)}</Text>
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconPlus size={14} stroke={1.5} />}
                              onClick={() => handleAddWeight(key)}
                            >
                              Add
                            </Button>
                          </Group>
                        ))}
                      </Stack>
                    </ScrollArea>
                  ) : (
                    <Text c="dimmed">All weights have been configured. Adjust them on the left.</Text>
                  )
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
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Generator"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this generator?</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeDeleteModal}
              disabled={deleteGeneratorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                void handleConfirmDeleteGenerator();
              }}
              loading={deleteGeneratorMutation.isPending}
              disabled={!selectedGenerator}
            >
              Delete Generator
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={editDetailsModalOpened}
        onClose={handleCancelEditDetails}
        title="Edit Generator Details"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            required
            label="Title"
            placeholder="Enter generator title"
            value={generatorTitleDraft}
            onChange={(event) => setGeneratorTitleDraft(event.currentTarget.value)}
          />
          <Textarea
            label="Notes"
            placeholder="Add optional notes"
            minRows={4}
            autosize
            value={generatorNotesDraft}
            onChange={(event) => setGeneratorNotesDraft(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCancelEditDetails}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEditDetails}>Done</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        title="Create Pick List Generator"
        centered
        size="lg"
      >
        <form onSubmit={handleSubmitCreateGenerator}>
          <Stack gap="md">
            <TextInput
              required
              label="Title"
              placeholder="Enter generator title"
              value={createGeneratorTitle}
              onChange={(event) => setCreateGeneratorTitle(event.currentTarget.value)}
            />
            <Textarea
              label="Notes"
              placeholder="Add optional notes"
              minRows={3}
              autosize
              value={createGeneratorNotes}
              onChange={(event) => setCreateGeneratorNotes(event.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={handleCloseCreateModal}>
                Cancel
              </Button>
              <Button type="submit" loading={createGeneratorMutation.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
}
