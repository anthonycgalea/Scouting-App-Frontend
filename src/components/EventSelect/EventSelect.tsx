import { useEffect, useState } from 'react';
import cx from 'clsx';
import {
  ActionIcon,
  Button,
  Modal,
  Radio,
  Group,
  ScrollArea,
  Stack,
  Switch,
  Table,
  Text,
  VisuallyHidden,
  useMantineColorScheme,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  type OrganizationEventDetail,
  useOrganizationEvents,
  useUpdateOrganizationEvents,
  useDeleteOrganizationEvent,
  useUserInfo,
  useUserRole,
  useUserOrganization,
} from '@/api';
import classes from './EventSelect.module.css';

const sortEventsByWeekDescending = (
  eventList: OrganizationEventDetail[]
): OrganizationEventDetail[] => {
  return [...eventList].sort((eventA, eventB) => {
    const eventAWeek = eventA.week ?? Number.NEGATIVE_INFINITY;
    const eventBWeek = eventB.week ?? Number.NEGATIVE_INFINITY;

    if (eventAWeek === eventBWeek) {
      return eventA.eventName.localeCompare(eventB.eventName);
    }

    return eventBWeek - eventAWeek;
  });
};

export function EventSelect() {
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const { data: userRole } = useUserRole({ enabled: isUserLoggedIn });
  const {
    data: userOrganization,
    isLoading: isUserOrganizationLoading,
    isError: isUserOrganizationError,
  } = useUserOrganization({ enabled: isUserLoggedIn });
  const organizationId = userOrganization?.organization_id ?? null;
  const {
    data,
    isLoading,
    isError,
  } = useOrganizationEvents({ enabled: isUserLoggedIn && !!organizationId });
  const [events, setEvents] = useState<OrganizationEventDetail[]>([]);
  const [initialEvents, setInitialEvents] = useState<OrganizationEventDetail[]>([]);
  const { colorScheme } = useMantineColorScheme();
  const { mutate: updateOrganizationEventsMutation, isPending: isSavingEvents } =
    useUpdateOrganizationEvents();
  const {
    mutate: deleteOrganizationEventMutation,
    isPending: isDeletingEvent,
  } = useDeleteOrganizationEvent();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [eventPendingDeletion, setEventPendingDeletion] =
    useState<OrganizationEventDetail | null>(null);

  const deleteIconColor = colorScheme === 'dark' ? 'red' : 'black';
  const isAdminUser = userRole?.role === 'ADMIN';

  useEffect(() => {
    if (!organizationId) {
      setEvents([]);
      setInitialEvents([]);
      return;
    }

    if (data) {
      const sortedEvents = sortEventsByWeekDescending(data);

      setEvents(sortedEvents.map((event) => ({ ...event })));
      setInitialEvents(sortedEvents.map((event) => ({ ...event })));
    }
  }, [data, organizationId]);

  const activeEventId = events.find((event) => event.isActive)?.eventKey ?? '';

  const setActiveEventId = (eventKey: string) => {
    setEvents((current) =>
      current.map((event) => ({
        ...event,
        isActive: event.eventKey === eventKey,
      }))
    );
  };

  const toggleEventPublic = (eventKey: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.eventKey === eventKey ? { ...event, isPublic: !event.isPublic } : event
      )
    );
  };

  const handleRequestDeleteEvent = (event: OrganizationEventDetail) => {
    setEventPendingDeletion(event);
    openDeleteModal();
  };

  const handleCloseDeleteModal = () => {
    closeDeleteModal();
    setEventPendingDeletion(null);
  };

  const handleConfirmDeleteEvent = () => {
    const eventKey = eventPendingDeletion?.eventKey;

    if (!eventKey) {
      return;
    }

    deleteOrganizationEventMutation(
      { eventKey },
      {
        onSuccess: () => {
          setEvents((current) => current.filter((event) => event.eventKey !== eventKey));
          setInitialEvents((current) =>
            current.filter((event) => event.eventKey !== eventKey)
          );
          handleCloseDeleteModal();
        },
      }
    );
  };

  const rows = events.map((event) => {
    const selected = activeEventId === event.eventKey;
    return (
      <Table.Tr key={event.eventKey} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Radio
            aria-label={`Set ${event.eventName} as the active event`}
            value={event.eventKey}
            name="active-event"
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {event.eventName}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" ta="center">
            {event.week ?? '—'}
          </Text>
        </Table.Td>
        <Table.Td>
          <Switch
            aria-label={`Toggle public visibility for ${event.eventName}`}
            checked={event.isPublic}
            onChange={() => toggleEventPublic(event.eventKey)}
          />
        </Table.Td>
        <Table.Td ta="right">
          {isAdminUser && (
            <ActionIcon
              variant="transparent"
              aria-label={`Delete ${event.eventName}`}
              c={deleteIconColor}
              onClick={() => handleRequestDeleteEvent(event)}
            >
              <IconTrash stroke={1.5} />
            </ActionIcon>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  const hasChanges =
    events.length !== initialEvents.length ||
    events.some((event) => {
      const initialEvent = initialEvents.find(({ eventKey }) => eventKey === event.eventKey);
      if (!initialEvent) {
        return true;
      }

      return initialEvent.isActive !== event.isActive || initialEvent.isPublic !== event.isPublic;
    });

  const isLoadingEvents = isLoading || isUserOrganizationLoading;
  const isErrorLoadingEvents = isError || isUserOrganizationError;
  const shouldPromptForOrganization =
    !isLoadingEvents && !isErrorLoadingEvents && isUserLoggedIn && !organizationId;

  const handleSaveChanges = () => {
    if (!organizationId) {
      return;
    }

    const payload = events.map(({ eventKey, isActive, isPublic }) => ({
      eventKey,
      isActive,
      isPublic,
    }));

    updateOrganizationEventsMutation(
      { events: payload },
      {
        onSuccess: () => {
          setInitialEvents(events.map((event) => ({ ...event })));
        },
      }
    );
  };

  return (
    <Stack>
      <ScrollArea>
        <Radio.Group value={activeEventId} onChange={setActiveEventId} name="active-event">
          <Table miw={650} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>Active</Table.Th>
                <Table.Th>Event Name</Table.Th>
                <Table.Th w={80} ta="center">
                  Week
                </Table.Th>
                <Table.Th>Public</Table.Th>
                <Table.Th w={60}>
                  <VisuallyHidden>Delete</VisuallyHidden>
                </Table.Th>
            </Table.Tr>
          </Table.Thead>
            <Table.Tbody>
              {isLoadingEvents ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      Loading events...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : isErrorLoadingEvents ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="red">
                      Unable to load events. Please try again later.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : shouldPromptForOrganization ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      Select an organization to manage its events.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length > 0 ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      No events have been added yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Radio.Group>
      </ScrollArea>
      <Group justify="space-between" w="100%">
        <Button
          component={Link}
          to="/eventSelect/add"
          variant="light"
          size="md"
          leftSection={<IconPlus stroke={1.5} />}
          disabled={!organizationId}
        >
          Add Event
        </Button>
        <Button
          disabled={!hasChanges || !organizationId}
          loading={isSavingEvents}
          onClick={handleSaveChanges}
          size="md"
        >
          Save Changes
        </Button>
      </Group>
      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        title="Delete Event"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete {eventPendingDeletion?.eventName ?? 'this event'}?
          </Text>
          <Text c="red">
            Stored data associated with this event will be unrecoverable.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDeleteModal} disabled={isDeletingEvent}>
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmDeleteEvent} loading={isDeletingEvent}>
              Delete Event
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
