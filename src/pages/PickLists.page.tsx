import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconPlus } from '@tabler/icons-react';

import { useOrganizationEvents } from '@/api/events';
import {
  useCreatePickList,
  useDeletePickList,
  usePickListGenerators,
  usePickLists,
  useUpdatePickList,
  type PickList,
  type PickListRank,
} from '@/api/pickLists';
import { useEventTeams, type EventTeam } from '@/api/teams';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';
import { PickListSelector } from '@/components/PickLists/PickListSelector';
import { PickListTeamsList } from '@/components/PickLists/PickListTeamsList';

const recalculateRanks = (ranks: PickListRank[]) => {
  const activeRanks = ranks.filter((rank) => !rank.dnp);
  const dnpRanks = ranks.filter((rank) => rank.dnp);

  return [
    ...activeRanks.map((rank, index) => ({
      ...rank,
      rank: index + 1,
    })),
    ...dnpRanks.map((rank, index) => ({
      ...rank,
      rank: -(index + 1),
    })),
  ];
};

export function PickListsPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  const [createModalOpened, { close: closeCreateModal, open: openCreateModal }] = useDisclosure(false);
  const [editMetadataModalOpened, { close: closeEditMetadataModal, open: openEditMetadataModal }] =
    useDisclosure(false);
  const [deleteModalOpened, { close: closeDeleteModal, open: openDeleteModal }] = useDisclosure(false);
  const [selectedPickListId, setSelectedPickListId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [shouldUseGenerator, setShouldUseGenerator] = useState(false);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string | null>(null);
  const [editablePickListRanks, setEditablePickListRanks] = useState<PickListRank[]>([]);
  const [editablePickListTitle, setEditablePickListTitle] = useState('');
  const [editablePickListNotes, setEditablePickListNotes] = useState('');
  const [activePickListTeamsTab, setActivePickListTeamsTab] = useState<'teams' | 'dnp'>('teams');
  const [addTeamSearchQuery, setAddTeamSearchQuery] = useState('');
  const [editMetadataDraftTitle, setEditMetadataDraftTitle] = useState('');
  const [editMetadataDraftNotes, setEditMetadataDraftNotes] = useState('');

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  const { data: organizationEvents, isLoading: isLoadingEvents } = useOrganizationEvents();
  const { data: pickLists, isLoading: isLoadingPickLists } = usePickLists();
  const {
    data: pickListGenerators,
    isLoading: isLoadingPickListGenerators,
  } = usePickListGenerators({ enabled: createModalOpened });
  const createPickListMutation = useCreatePickList();
  const updatePickListMutation = useUpdatePickList();
  const deletePickListMutation = useDeletePickList();

  const activeEvent = useMemo(
    () => organizationEvents?.find((event) => event.isActive) ?? null,
    [organizationEvents],
  );

  const {
    data: eventTeams = [],
    isLoading: isLoadingEventTeams,
  } = useEventTeams(activeEvent?.eventKey ?? '2025micmp4', {
    enabled: Boolean(activeEvent),
  });

  const pickListsForActiveEvent = useMemo<PickList[]>(() => {
    if (!activeEvent || !pickLists) {
      return [];
    }

    return pickLists.filter((list) => list.event_key === activeEvent.eventKey);
  }, [activeEvent, pickLists]);

  const sortedPickListsForActiveEvent = useMemo<PickList[]>(() => {
    return [...pickListsForActiveEvent].sort(
      (first, second) =>
        new Date(second.last_updated).getTime() - new Date(first.last_updated).getTime(),
    );
  }, [pickListsForActiveEvent]);

  useEffect(() => {
    if (sortedPickListsForActiveEvent.length === 0) {
      setSelectedPickListId(null);
      return;
    }

    setSelectedPickListId((current) => {
      if (current && sortedPickListsForActiveEvent.some((list) => list.id === current)) {
        return current;
      }

      return null;
    });
  }, [sortedPickListsForActiveEvent]);

  const selectedPickList = useMemo(
    () => sortedPickListsForActiveEvent.find((list) => list.id === selectedPickListId) ?? null,
    [sortedPickListsForActiveEvent, selectedPickListId],
  );

  useEffect(() => {
    if (!selectedPickList) {
      setEditablePickListRanks([]);
      setEditablePickListTitle('');
      setEditablePickListNotes('');
      setActivePickListTeamsTab('teams');
      setAddTeamSearchQuery('');
      return;
    }

    const sortedRanks = [...selectedPickList.ranks].sort((first, second) => {
      if (first.dnp === second.dnp) {
        if (first.dnp) {
          return Math.abs(first.rank) - Math.abs(second.rank);
        }

        return first.rank - second.rank;
      }

      return first.dnp ? 1 : -1;
    });

    setEditablePickListRanks(recalculateRanks(sortedRanks));
    setEditablePickListTitle(selectedPickList.title);
    setEditablePickListNotes(selectedPickList.notes ?? '');
    setActivePickListTeamsTab('teams');
    setAddTeamSearchQuery('');
  }, [selectedPickList]);

  const pickListTeamNumbers = useMemo(
    () => new Set(editablePickListRanks.map((rank) => rank.team_number)),
    [editablePickListRanks],
  );

  const availableTeams = useMemo(
    () => eventTeams.filter((team) => !pickListTeamNumbers.has(team.team_number)),
    [eventTeams, pickListTeamNumbers],
  );

  const filteredTeamsToAdd = useMemo(() => {
    const trimmedQuery = addTeamSearchQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      return availableTeams;
    }

    return availableTeams.filter((team) => {
      const teamNumberMatches = team.team_number.toString().includes(trimmedQuery);
      const teamNameMatches = team.team_name.toLowerCase().includes(trimmedQuery);

      return teamNumberMatches || teamNameMatches;
    });
  }, [addTeamSearchQuery, availableTeams]);

  const eventTeamsByNumber = useMemo(
    () => new Map(eventTeams.map((team) => [team.team_number, team] as const)),
    [eventTeams],
  );

  const activePickListRanks = useMemo(
    () => editablePickListRanks.filter((rank) => !rank.dnp),
    [editablePickListRanks],
  );

  const dnpPickListRanks = useMemo(
    () => editablePickListRanks.filter((rank) => rank.dnp),
    [editablePickListRanks],
  );

  const trimmedPickListNotes = editablePickListNotes.trim();
  const hasPickListNotes = trimmedPickListNotes.length > 0;
  const hasDnpTeams = dnpPickListRanks.length > 0;
  const hasActiveTeams = activePickListRanks.length > 0;

  useEffect(() => {
    if (!shouldUseGenerator) {
      setSelectedGeneratorId(null);
    }
  }, [shouldUseGenerator]);

  useEffect(() => {
    if (!hasDnpTeams && activePickListTeamsTab === 'dnp') {
      setActivePickListTeamsTab('teams');
    }
  }, [activePickListTeamsTab, hasDnpTeams]);

  const handleAddTeamToPickList = (team: EventTeam) => {
    if (!selectedPickList) {
      return;
    }

    setEditablePickListRanks((current) => {
      const nonDnpRanks = current.filter((rank) => !rank.dnp);
      const dnpRanks = current.filter((rank) => rank.dnp);

      return recalculateRanks([
        ...nonDnpRanks,
        {
          rank: nonDnpRanks.length + 1,
          team_number: team.team_number,
          notes: '',
          dnp: false,
        },
        ...dnpRanks,
      ]);
    });
  };

  const handleReorderActivePickListRanks = useCallback(
    (nextRanks: PickListRank[]) => {
      setEditablePickListRanks((current) => {
        const dnpRanks = current.filter((rank) => rank.dnp);
        return recalculateRanks([...nextRanks, ...dnpRanks]);
      });
    },
    [setEditablePickListRanks],
  );

  const handleReorderDnpPickListRanks = useCallback(
    (nextRanks: PickListRank[]) => {
      setEditablePickListRanks((current) => {
        const activeRanks = current.filter((rank) => !rank.dnp);
        return recalculateRanks([...activeRanks, ...nextRanks]);
      });
    },
    [setEditablePickListRanks],
  );

  const handleRemoveTeamFromPickList = useCallback(
    (teamNumber: number) => {
      setEditablePickListRanks((current) =>
        recalculateRanks(current.filter((rank) => rank.team_number !== teamNumber)),
      );
    },
    [setEditablePickListRanks],
  );

  const handleUpdatePickListTeamNotes = useCallback(
    (teamNumber: number, notes: string) => {
      setEditablePickListRanks((current) =>
        recalculateRanks(
          current.map((rank) =>
            rank.team_number === teamNumber
              ? {
                  ...rank,
                  notes,
                }
              : rank,
          ),
        ),
      );
    },
    [setEditablePickListRanks],
  );

  const handleTogglePickListTeamDnp = useCallback(
    (teamNumber: number) => {
      setEditablePickListRanks((current) => {
        const existingIndex = current.findIndex((rank) => rank.team_number === teamNumber);

        if (existingIndex === -1) {
          return current;
        }

        const existingRank = current[existingIndex];
        const nextIsDnp = !existingRank.dnp;
        const remaining = current.filter((rank) => rank.team_number !== teamNumber);
        const activeRanks = remaining.filter((rank) => !rank.dnp);
        const dnpRanks = remaining.filter((rank) => rank.dnp);
        const updatedRank: PickListRank = {
          ...existingRank,
          dnp: nextIsDnp,
        };

        if (nextIsDnp) {
          return recalculateRanks([...activeRanks, ...dnpRanks, updatedRank]);
        }

        return recalculateRanks([...activeRanks, updatedRank, ...dnpRanks]);
      });
    },
    [setEditablePickListRanks],
  );

  const handleOpenEditMetadataModal = useCallback(() => {
    setEditMetadataDraftTitle(editablePickListTitle);
    setEditMetadataDraftNotes(editablePickListNotes);
    openEditMetadataModal();
  }, [editablePickListNotes, editablePickListTitle, openEditMetadataModal]);

  const handleSubmitEditMetadata = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = editMetadataDraftTitle.trim();
      const trimmedNotes = editMetadataDraftNotes.trim();

      if (!trimmedTitle) {
        notifications.show({
          color: 'red',
          title: 'Title required',
          message: 'Please provide a title for the pick list.',
        });
        return;
      }

      setEditablePickListTitle(trimmedTitle);
      setEditablePickListNotes(trimmedNotes);
      closeEditMetadataModal();
    },
    [closeEditMetadataModal, editMetadataDraftNotes, editMetadataDraftTitle],
  );

  const handleSavePickListChanges = useCallback(async () => {
    if (!selectedPickList) {
      return;
    }

    const trimmedTitle = editablePickListTitle.trim();
    const trimmedNotes = editablePickListNotes.trim();

    if (!trimmedTitle) {
      notifications.show({
        color: 'red',
        title: 'Title required',
        message: 'Please provide a title for the pick list.',
      });
      return;
    }

    const sanitizedRanks = editablePickListRanks.map((rank) => ({
      ...rank,
      notes: rank.notes.trim(),
    }));

    try {
      await updatePickListMutation.mutateAsync({
        id: selectedPickList.id,
        title: trimmedTitle,
        notes: trimmedNotes,
        favorited: selectedPickList.favorited,
        ranks: sanitizedRanks,
      });

      setEditablePickListTitle(trimmedTitle);
      setEditablePickListNotes(trimmedNotes);

      notifications.show({
        color: 'green',
        title: 'Pick list saved',
        message: `Saved “${trimmedTitle}”.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to save pick list',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while saving the pick list.',
      });
    }
  }, [
    editablePickListNotes,
    editablePickListRanks,
    editablePickListTitle,
    selectedPickList,
    setEditablePickListNotes,
    setEditablePickListTitle,
    updatePickListMutation,
  ]);

  const handleCloseCreateModal = () => {
    setTitle('');
    setNotes('');
    setShouldUseGenerator(false);
    setSelectedGeneratorId(null);
    closeCreateModal();
  };

  const handleCreatePickList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedTitle) {
      notifications.show({
        color: 'red',
        title: 'Title required',
        message: 'Please provide a title for the pick list before creating it.',
      });
      return;
    }

    try {
      await createPickListMutation.mutateAsync({
        title: trimmedTitle,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        ranks: [],
      });

      notifications.show({
        color: 'green',
        title: 'Pick list created',
        message: shouldUseGenerator && selectedGeneratorId
          ? `Created “${trimmedTitle}”. Configure generator output next to finish setup.`
          : `Created “${trimmedTitle}”.`,
      });

      handleCloseCreateModal();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to create pick list',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while creating the pick list.',
      });
    }
  };

  const handleConfirmDeletePickList = useCallback(async () => {
    if (!selectedPickList) {
      return;
    }

    const pickListId = selectedPickList.id;
    const pickListTitle = selectedPickList.title;

    try {
      await deletePickListMutation.mutateAsync({ id: pickListId });

      setSelectedPickListId((current) => (current === pickListId ? null : current));
      closeDeleteModal();

      notifications.show({
        color: 'green',
        title: 'Pick list deleted',
        message: `Deleted “${pickListTitle}”.`,
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Unable to delete pick list',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while deleting the pick list.',
      });
    }
  }, [closeDeleteModal, deletePickListMutation, selectedPickList, setSelectedPickListId]);

  const activeEventName = activeEvent?.eventName ?? 'Active event';
  const isLoadingData = isLoadingEvents || isLoadingPickLists;

  return (
    <Box p="md" h="100%">
      <Stack gap="lg" h="100%">
        <Group align="center" justify="space-between">
          <Title order={2}>Pick Lists</Title>
          <Button leftSection={<IconPlus stroke={1.5} size={16} />} onClick={openCreateModal}>
            New Pick List
          </Button>
        </Group>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap="md"
          style={{ flex: 1, minHeight: 0 }}
        >
          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{ flex: 4, display: 'flex', minHeight: 0 }}
          >
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              {selectedPickList ? (
                <>
                  <Stack gap="xs">
                    <Group gap="xs" align="center" justify="space-between" wrap="nowrap">
                      <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          fw={600}
                          size="lg"
                          lineClamp={1}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          {editablePickListTitle}
                        </Text>
                        <Text c="dimmed" size="sm" style={{ flexShrink: 0 }}>
                          Last updated{' '}
                          {new Date(selectedPickList.last_updated).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Text>
                      </Group>
                      <Tooltip
                        label={hasPickListNotes ? trimmedPickListNotes : 'Add pick list notes'}
                        multiline
                        maw={260}
                        withinPortal
                      >
                        <ActionIcon
                          aria-label="Edit pick list title and notes"
                          variant="subtle"
                          color={hasPickListNotes ? 'green' : 'gray'}
                          onClick={handleOpenEditMetadataModal}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                  <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
                    <Tabs
                      value={activePickListTeamsTab}
                      onChange={(value) =>
                        setActivePickListTeamsTab((value ?? 'teams') as 'teams' | 'dnp')
                      }
                      keepMounted={false}
                      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                    >
                      <Tabs.List grow style={{ width: '100%' }}>
                        <Tabs.Tab value="teams">Teams</Tabs.Tab>
                        {hasDnpTeams && <Tabs.Tab value="dnp">DNP</Tabs.Tab>}
                      </Tabs.List>

                      <Tabs.Panel
                        value="teams"
                        style={{
                          flex: 1,
                          minHeight: 0,
                          display: 'flex',
                          paddingTop: 'var(--mantine-spacing-sm)',
                        }}
                      >
                        {hasActiveTeams ? (
                          <ScrollArea style={{ flex: 1 }}>
                            <PickListTeamsList
                              ranks={activePickListRanks}
                              eventTeamsByNumber={eventTeamsByNumber}
                              onReorder={handleReorderActivePickListRanks}
                              onRemoveTeam={handleRemoveTeamFromPickList}
                              onUpdateNotes={handleUpdatePickListTeamNotes}
                              onToggleDnp={handleTogglePickListTeamDnp}
                            />
                          </ScrollArea>
                        ) : (
                          <Text c="dimmed" size="sm">
                            No active teams have been added to this pick list yet.
                          </Text>
                        )}
                      </Tabs.Panel>

                      {hasDnpTeams && (
                        <Tabs.Panel
                          value="dnp"
                          style={{
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            paddingTop: 'var(--mantine-spacing-sm)',
                          }}
                        >
                          <ScrollArea style={{ flex: 1 }}>
                            <PickListTeamsList
                              ranks={dnpPickListRanks}
                              eventTeamsByNumber={eventTeamsByNumber}
                              onReorder={handleReorderDnpPickListRanks}
                              onRemoveTeam={handleRemoveTeamFromPickList}
                              onUpdateNotes={handleUpdatePickListTeamNotes}
                              onToggleDnp={handleTogglePickListTeamDnp}
                            />
                          </ScrollArea>
                        </Tabs.Panel>
                      )}
                    </Tabs>
                  </Stack>
                  <Group justify="space-between" mt="auto">
                    <Button
                      type="button"
                      onClick={handleSavePickListChanges}
                      loading={updatePickListMutation.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      onClick={openDeleteModal}
                      loading={deletePickListMutation.isPending}
                    >
                      Delete Pick List
                    </Button>
                  </Group>
                </>
              ) : (
                <Text c="dimmed">Select a pick list to view its details.</Text>
              )}
            </Stack>
          </Card>

          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{ flex: 1, display: 'flex', minHeight: 0 }}
          >
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Add Teams to Pick List</Title>
              <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                <Stack gap="sm" p="xs">
                  {!selectedPickList ? (
                    <Text c="dimmed">Select a pick list to start adding teams.</Text>
                  ) : !activeEvent ? (
                    <Text c="dimmed">
                      Set an active event for your organization to choose from event teams.
                    </Text>
                  ) : isLoadingEventTeams ? (
                    <Text c="dimmed">Loading teams…</Text>
                  ) : availableTeams.length === 0 ? (
                    <Text c="dimmed" size="sm">
                      Every team at this event is already part of the pick list.
                    </Text>
                  ) : (
                    <Stack gap="sm">
                      <TextInput
                        placeholder="Search teams by number or name"
                        value={addTeamSearchQuery}
                        onChange={(event) => setAddTeamSearchQuery(event.currentTarget.value)}
                      />
                      {filteredTeamsToAdd.length > 0 ? (
                        <Stack gap="xs" py="xs">
                          {filteredTeamsToAdd.map((team) => (
                            <Group key={team.team_number} justify="space-between" wrap="nowrap">
                              <Stack gap={0}>
                                <Text fw={600} size="sm">
                                  Team {team.team_number}
                                </Text>
                                <Text c="dimmed" size="sm">
                                  {team.team_name}
                                </Text>
                              </Stack>
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => handleAddTeamToPickList(team)}
                                aria-label={`Add team ${team.team_number} to pick list`}
                              >
                                Add
                              </Button>
                            </Group>
                          ))}
                        </Stack>
                      ) : (
                        <Text c="dimmed" size="sm">
                          No teams match your search.
                        </Text>
                      )}
                    </Stack>
                  )}
                </Stack>
              </ScrollArea>
            </Stack>
          </Card>

          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{ flex: 2, display: 'flex', minHeight: 0 }}
          >
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Title order={4}>Active Event Pick Lists</Title>
              {isLoadingData ? (
                <Text c="dimmed">Loading pick lists…</Text>
              ) : !activeEvent ? (
                <Text c="dimmed">
                  Set an active event for your organization to start selecting pick lists.
                </Text>
              ) : pickListsForActiveEvent.length === 0 ? (
                <Text c="dimmed">
                  There are no pick lists for {activeEventName}. Create one to get started.
                </Text>
              ) : (
                <Stack gap="sm">
                  <Text c="dimmed" size="sm">
                    Showing pick lists for {activeEventName}.
                  </Text>
                  <PickListSelector
                    pickLists={sortedPickListsForActiveEvent}
                    selectedPickListId={selectedPickListId}
                    onSelectPickList={(pickListId) => setSelectedPickListId(pickListId)}
                  />
                  <Text c="dimmed" size="sm">
                    Click a pick list to load it in the manager on the left.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Card>
        </Flex>
      </Stack>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Pick List"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this pick list?</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeDeleteModal}
              disabled={deletePickListMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDeletePickList}
              loading={deletePickListMutation.isPending}
            >
              Delete Pick List
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={editMetadataModalOpened}
        onClose={closeEditMetadataModal}
        title="Edit Pick List"
        centered
      >
        <form onSubmit={handleSubmitEditMetadata}>
          <Stack gap="md">
            <TextInput
              required
              label="Title"
              placeholder="Enter pick list title"
              value={editMetadataDraftTitle}
              onChange={(event) => setEditMetadataDraftTitle(event.currentTarget.value)}
            />
            <Textarea
              label="Notes"
              placeholder="Add optional notes"
              minRows={3}
              autosize
              value={editMetadataDraftNotes}
              onChange={(event) => setEditMetadataDraftNotes(event.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={closeEditMetadataModal}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        title="Create Pick List"
        centered
      >
        <form onSubmit={handleCreatePickList}>
          <Stack gap="md">
            <TextInput
              required
              label="Title"
              placeholder="Enter pick list title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
            <Textarea
              label="Notes"
              placeholder="Add optional notes"
              minRows={3}
              autosize
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
            />
            <Checkbox
              label="Use Pick List Generator"
              checked={shouldUseGenerator}
              onChange={(event) => setShouldUseGenerator(event.currentTarget.checked)}
            />
            {shouldUseGenerator && (
              <Stack gap="sm">
                {isLoadingPickListGenerators ? (
                  <Text c="dimmed">Loading pick list generators…</Text>
                ) : (pickListGenerators?.length ?? 0) > 0 ? (
                  <Select
                    data={pickListGenerators?.map((generator) => ({
                      value: generator.id,
                      label: generator.title,
                    })) ?? []}
                    label="Pick list generator"
                    placeholder="Select a generator"
                    value={selectedGeneratorId}
                    onChange={setSelectedGeneratorId}
                  />
                ) : (
                  <Text c="dimmed" size="sm">
                    You do not have any pick list generators yet.
                  </Text>
                )}
              </Stack>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={handleCloseCreateModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createPickListMutation.isPending}
                disabled={
                  shouldUseGenerator &&
                  !isLoadingPickListGenerators &&
                  (pickListGenerators?.length ?? 0) > 0 &&
                  !selectedGeneratorId
                }
              >
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
}
