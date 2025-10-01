import { type FormEvent, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';

import { useOrganizationEvents } from '@/api/events';
import {
  useCreatePickList,
  usePickListGenerators,
  usePickLists,
  type PickList,
} from '@/api/pickLists';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';
import { PickListSelector } from '@/components/PickLists/PickListSelector';

export function PickListsPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  const [createModalOpened, { close: closeCreateModal, open: openCreateModal }] = useDisclosure(false);
  const [selectedPickListId, setSelectedPickListId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [shouldUseGenerator, setShouldUseGenerator] = useState(false);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string | null>(null);

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

  const activeEvent = useMemo(
    () => organizationEvents?.find((event) => event.isActive) ?? null,
    [organizationEvents],
  );

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

      return sortedPickListsForActiveEvent[0]?.id ?? null;
    });
  }, [sortedPickListsForActiveEvent]);

  const selectedPickList = useMemo(
    () => sortedPickListsForActiveEvent.find((list) => list.id === selectedPickListId) ?? null,
    [sortedPickListsForActiveEvent, selectedPickListId],
  );

  useEffect(() => {
    if (!shouldUseGenerator) {
      setSelectedGeneratorId(null);
    }
  }, [shouldUseGenerator]);

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

  const activeEventName = activeEvent?.eventName ?? 'Active event';
  const isLoadingData = isLoadingEvents || isLoadingPickLists;

  return (
    <Box p="md">
      <Stack gap="lg">
        <Group align="center" justify="space-between">
          <Title order={2}>Pick Lists</Title>
          <Button leftSection={<IconPlus stroke={1.5} size={16} />} onClick={openCreateModal}>
            New Pick List
          </Button>
        </Group>

        <Flex direction={{ base: 'column', md: 'row' }} gap="md">
          <Card withBorder padding="lg" radius="md" style={{ flex: 2 }}>
            <Stack gap="md" h="100%">
              {selectedPickList ? (
                <>
                  <Stack gap="xs">
                    <Text fw={600} size="lg">
                      {selectedPickList.title}
                    </Text>
                    <Text c="dimmed" size="sm">
                      Last updated{' '}
                      {new Date(selectedPickList.last_updated).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                    {selectedPickList.notes ? (
                      <Text size="sm">{selectedPickList.notes}</Text>
                    ) : (
                      <Text c="dimmed" size="sm">
                        This pick list does not have any notes yet.
                      </Text>
                    )}
                  </Stack>
                  <Group justify="space-between" mt="auto">
                    <Button>Save Changes</Button>
                    <Button color="red" variant="light">
                      delete pick list
                    </Button>
                  </Group>
                </>
              ) : (
                <Text c="dimmed">Select a pick list to view its details.</Text>
              )}
            </Stack>
          </Card>

          <Card withBorder padding="lg" radius="md" style={{ flex: 1 }}>
            <Stack gap="sm">
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
