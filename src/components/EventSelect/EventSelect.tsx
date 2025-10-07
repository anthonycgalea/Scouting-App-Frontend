import { useEffect, useMemo, useState } from 'react';
import cx from 'clsx';
import {
  Alert,
  ActionIcon,
  Button,
  Modal,
  Group,
  ScrollArea,
  Select,
  Stack,
  Radio,
  Table,
  Text,
  TextInput,
  Title,
  VisuallyHidden,
  useMantineColorScheme,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconCheck, IconMail, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  type OrganizationEventDetail,
  useAllOrganizations,
  useInviteOrganizationCollaboration,
  useOrganizationEvents,
  useOrganizationCollaborations,
  useUpdateOrganizationEvents,
  useDeleteOrganizationEvent,
  useAcceptOrganizationCollaboration,
  useDeclineOrganizationCollaboration,
  useUserInfo,
  useUserRole,
  useUserOrganization,
} from '@/api';
import classes from './EventSelect.module.css';

const ALLOWED_EVENT_YEARS = [2026, 2025] as const;
const ALLOWED_EVENT_YEAR_OPTIONS = ALLOWED_EVENT_YEARS.map((year) => ({
  value: year.toString(),
  label: year.toString(),
}));
const ALLOWED_EVENT_YEAR_VALUE_SET = new Set(
  ALLOWED_EVENT_YEAR_OPTIONS.map((option) => option.value)
);

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
  const {
    data: allOrganizations,
    isLoading: isAllOrganizationsLoading,
    isError: isAllOrganizationsError,
  } = useAllOrganizations();
  const {
    data: organizationCollaborations,
    isLoading: isOrganizationCollaborationsLoading,
    isError: isOrganizationCollaborationsError,
  } = useOrganizationCollaborations({ enabled: isUserLoggedIn && !!organizationId });
  const inviteOrganizationCollaborationMutation = useInviteOrganizationCollaboration();
  const acceptOrganizationCollaborationMutation = useAcceptOrganizationCollaboration();
  const declineOrganizationCollaborationMutation = useDeclineOrganizationCollaboration();
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
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] =
    useDisclosure(false);
  const [eventPendingDeletion, setEventPendingDeletion] =
    useState<OrganizationEventDetail | null>(null);
  const [inviteSearchTerm, setInviteSearchTerm] = useState('');
  const [pendingInviteOrganizationId, setPendingInviteOrganizationId] =
    useState<number | null>(null);
  const [pendingCollaborationId, setPendingCollaborationId] = useState<string | null>(null);
  const [pendingCollaborationAction, setPendingCollaborationAction] =
    useState<'accept' | 'decline' | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(
    ALLOWED_EVENT_YEAR_OPTIONS[0]?.value ?? ''
  );
  const [hasUserSelectedYear, setHasUserSelectedYear] = useState(false);

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

  const selectedEvent = useMemo(
    () => events.find((event) => event.isActive) ?? null,
    [events]
  );
  const allowedEventYearsWithData = useMemo(() => {
    const allowedYearSet = new Set<number>(ALLOWED_EVENT_YEARS);

    return Array.from(
      new Set(
        events
          .map((event) => event.eventYear)
          .filter(
            (year): year is number =>
              typeof year === 'number' && allowedYearSet.has(year)
          )
      )
    ).sort((a, b) => b - a);
  }, [events]);
  const yearOptions = useMemo(() => ALLOWED_EVENT_YEAR_OPTIONS, []);
  const activeEventYearValue = selectedEvent?.eventYear
    ? selectedEvent.eventYear.toString()
    : null;
  const defaultYearValue = useMemo(() => {
    if (activeEventYearValue && ALLOWED_EVENT_YEAR_VALUE_SET.has(activeEventYearValue)) {
      return activeEventYearValue;
    }

    const availableYearValue = allowedEventYearsWithData[0]?.toString();

    if (availableYearValue) {
      return availableYearValue;
    }

    return ALLOWED_EVENT_YEAR_OPTIONS[0]?.value ?? '';
  }, [activeEventYearValue, allowedEventYearsWithData]);

  useEffect(() => {
    if (!hasUserSelectedYear) {
      if (selectedYear !== defaultYearValue) {
        setSelectedYear(defaultYearValue);
      }
      return;
    }

    if (!ALLOWED_EVENT_YEAR_VALUE_SET.has(selectedYear)) {
      setSelectedYear(defaultYearValue);
      setHasUserSelectedYear(false);
    }
  }, [
    defaultYearValue,
    hasUserSelectedYear,
    selectedYear,
  ]);

  const filteredEvents = useMemo(() => {
    return events.filter(
      (event) => event.eventYear?.toString() === selectedYear
    );
  }, [events, selectedYear]);
  const selectedOrganizationEventId = selectedEvent?.organizationEventId ?? null;
  const hasSelectedEvent = Boolean(selectedEvent);
  const canInviteOrganizations = Boolean(organizationId && hasSelectedEvent);

  const availableOrganizations = useMemo(() => {
    if (!hasSelectedEvent) {
      return [];
    }

    const collaborationOrganizationIds = selectedOrganizationEventId
      ? new Set(
          (organizationCollaborations ?? [])
            .filter(
              (collaboration) => collaboration.organizationEventId === selectedOrganizationEventId
            )
            .map((collaboration) => collaboration.organizationId)
        )
      : new Set<number>();

    return (allOrganizations ?? []).filter(
      (organization) =>
        organization.id !== organizationId && !collaborationOrganizationIds.has(organization.id)
    );
  }, [
    allOrganizations,
    organizationCollaborations,
    organizationId,
    hasSelectedEvent,
    selectedOrganizationEventId,
  ]);

  const filteredInviteOrganizations = useMemo(() => {
    const normalizedSearch = inviteSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableOrganizations;
    }

    return availableOrganizations.filter((organization) => {
      const matchesName = organization.name.toLowerCase().includes(normalizedSearch);
      const matchesTeamNumber = organization.team_number
        .toString()
        .includes(normalizedSearch);

      return matchesName || matchesTeamNumber;
    });
  }, [availableOrganizations, inviteSearchTerm]);

  const pendingCollaborations = useMemo(
    () =>
      (organizationCollaborations ?? []).filter(
        (collaboration) => collaboration.status === 'PENDING'
      ),
    [organizationCollaborations]
  );

  const handleSelectActiveEvent = (eventKey: string) => {
    setEvents((current) =>
      current.map((event) => ({
        ...event,
        isActive: event.eventKey === eventKey,
      }))
    );
  };

  const handleRequestDeleteEvent = (event: OrganizationEventDetail) => {
    setEventPendingDeletion(event);
    openDeleteModal();
  };

  const handleYearChange = (value: string | null) => {
    if (!value) {
      setHasUserSelectedYear(false);
      setSelectedYear(defaultYearValue);
      return;
    }

    setHasUserSelectedYear(true);
    setSelectedYear(value);
  };

  const handleCloseDeleteModal = () => {
    closeDeleteModal();
    setEventPendingDeletion(null);
  };

  const handleOpenInviteModal = () => {
    setInviteFeedback(null);
    setInviteSearchTerm('');
    openInviteModal();
  };

  const handleCloseInviteModal = () => {
    closeInviteModal();
    setInviteFeedback(null);
    setInviteSearchTerm('');
  };

  const handleInviteOrganization = async (targetOrganizationId: number) => {
    if (!hasSelectedEvent) {
      setInviteFeedback({
        type: 'error',
        message: 'Select an event before inviting organizations.',
      });
      return;
    }

    setInviteFeedback(null);
    setPendingInviteOrganizationId(targetOrganizationId);

    try {
      await inviteOrganizationCollaborationMutation.mutateAsync({
        organizationid: targetOrganizationId,
      });
      setInviteFeedback({
        type: 'success',
        message: 'Invitation sent successfully.',
      });
    } catch (error) {
      console.error('Failed to send scouting alliance invitation', error);
      setInviteFeedback({
        type: 'error',
        message: 'Failed to send invite. Please try again.',
      });
    } finally {
      setPendingInviteOrganizationId(null);
    }
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

  const handleAcceptCollaboration = (organizationEventId: string) => {
    setPendingCollaborationId(organizationEventId);
    setPendingCollaborationAction('accept');
    acceptOrganizationCollaborationMutation.mutate(
      { organizationEventId },
      {
        onSettled: () => {
          setPendingCollaborationId(null);
          setPendingCollaborationAction(null);
        },
      }
    );
  };

  const handleDeclineCollaboration = (organizationEventId: string) => {
    setPendingCollaborationId(organizationEventId);
    setPendingCollaborationAction('decline');
    declineOrganizationCollaborationMutation.mutate(
      { organizationEventId },
      {
        onSettled: () => {
          setPendingCollaborationId(null);
          setPendingCollaborationAction(null);
        },
      }
    );
  };

  const rows = filteredEvents.map((event) => {
    const selected = event.isActive;
    return (
      <Table.Tr key={event.eventKey} className={cx({ [classes.rowSelected]: selected })}>
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
          <Text size="sm" ta="center">
            {event.eventYear ?? '—'}
          </Text>
        </Table.Td>
        <Table.Td w={80} ta="center">
          <Radio
            name="active-event"
            aria-label={`Select ${event.eventName} as active event`}
            checked={selected}
            onChange={() => handleSelectActiveEvent(event.eventKey)}
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

  const inviteRows = filteredInviteOrganizations.map((organization) => (
    <Table.Tr key={organization.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {organization.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">Team {organization.team_number}</Text>
      </Table.Td>
      <Table.Td>
        <Button
          variant="light"
          leftSection={<IconMail stroke={1.5} />}
          loading={
            pendingInviteOrganizationId === organization.id &&
            inviteOrganizationCollaborationMutation.isPending
          }
          onClick={() => handleInviteOrganization(organization.id)}
        >
          Invite
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  const isInviteListLoading = isAllOrganizationsLoading || isOrganizationCollaborationsLoading;
  const hasInviteListError = isAllOrganizationsError || isOrganizationCollaborationsError;
  const isPendingCollaborationsLoading = isOrganizationCollaborationsLoading;
  const hasPendingCollaborationsError = isOrganizationCollaborationsError;

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
      <Group justify="flex-end" gap="sm">
        <Select
          label="Year"
          data={yearOptions}
          value={selectedYear}
          onChange={handleYearChange}
          style={{ width: 160 }}
          disabled={yearOptions.length === 0}
        />
      </Group>
      <ScrollArea>
        <Table miw={650} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event Name</Table.Th>
              <Table.Th w={80} ta="center">
                Week
              </Table.Th>
              <Table.Th w={80} ta="center">
                Year
              </Table.Th>
              <Table.Th w={80} ta="center">
                Active
              </Table.Th>
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
                    {events.length > 0 && selectedYear !== 'all'
                      ? `No events found for ${selectedYear}.`
                      : 'No events have been added yet.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Group justify="space-between" w="100%">
        <Group gap="sm">
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
            variant="light"
            size="md"
            leftSection={<IconMail stroke={1.5} />}
            onClick={handleOpenInviteModal}
            disabled={!canInviteOrganizations}
          >
            Invite Scouting Alliance
          </Button>
        </Group>
        <Button
          disabled={!hasChanges || !organizationId}
          loading={isSavingEvents}
          onClick={handleSaveChanges}
          size="md"
        >
          Save Changes
        </Button>
      </Group>
      <Stack gap="xs">
        <Title order={4}>Pending Scouting Alliances</Title>
        <ScrollArea>
          <Table miw={650} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Organization Name</Table.Th>
                <Table.Th>Team Number</Table.Th>
                <Table.Th>Event Name</Table.Th>
                <Table.Th>Event Week</Table.Th>
                <Table.Th>Event Year</Table.Th>
                <Table.Th w={140}>
                  <VisuallyHidden>Accept</VisuallyHidden>
                </Table.Th>
                <Table.Th w={140}>
                  <VisuallyHidden>Decline</VisuallyHidden>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isPendingCollaborationsLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed">
                      Loading pending scouting alliances...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : hasPendingCollaborationsError ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="red">
                      Unable to load pending scouting alliances. Please try again later.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : pendingCollaborations.length > 0 ? (
                pendingCollaborations.map((collaboration) => {
                  const isActionPendingForRow =
                    pendingCollaborationId === collaboration.organizationEventId &&
                    (acceptOrganizationCollaborationMutation.isPending ||
                      declineOrganizationCollaborationMutation.isPending);
                  const isAcceptLoading =
                    isActionPendingForRow && pendingCollaborationAction === 'accept';
                  const isDeclineLoading =
                    isActionPendingForRow && pendingCollaborationAction === 'decline';

                  return (
                    <Table.Tr key={collaboration.organizationEventId}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {collaboration.organizationName}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {collaboration.teamNumber ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{collaboration.eventName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ta="center">
                          {collaboration.eventWeek ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ta="center">
                          {collaboration.eventYear ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          color="green"
                          variant="light"
                          leftSection={<IconCheck size={16} />}
                          loading={isAcceptLoading}
                          disabled={isActionPendingForRow && pendingCollaborationAction === 'decline'}
                          onClick={() => handleAcceptCollaboration(collaboration.organizationEventId)}
                        >
                          Accept
                        </Button>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          color="red"
                          variant="light"
                          leftSection={<IconX size={16} />}
                          loading={isDeclineLoading}
                          disabled={isActionPendingForRow && pendingCollaborationAction === 'accept'}
                          onClick={() => handleDeclineCollaboration(collaboration.organizationEventId)}
                        >
                          Decline
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed">
                      No pending scouting alliances.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
      <Modal
        opened={inviteModalOpened}
        onClose={handleCloseInviteModal}
        title="Invite Scouting Alliance"
        centered
        size="lg"
      >
        <Stack gap="md">
          {selectedEvent ? (
            <>
              <Title order={4}>Invite organizations to {selectedEvent.eventName}</Title>
              <TextInput
                label="Search"
                placeholder="Search organizations"
                value={inviteSearchTerm}
                onChange={(event) => setInviteSearchTerm(event.currentTarget.value)}
              />
              {inviteFeedback ? (
                <Alert
                  color={inviteFeedback.type === 'success' ? 'green' : 'red'}
                  variant="light"
                >
                  {inviteFeedback.message}
                </Alert>
              ) : null}
              <ScrollArea h={320}>
                <Table miw={600} verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Organization</Table.Th>
                      <Table.Th>Team</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {isInviteListLoading ? (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text size="sm" c="dimmed">
                            Loading organizations...
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : hasInviteListError ? (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text size="sm" c="red">
                            Unable to load organizations. Please try again later.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : inviteRows.length > 0 ? (
                      inviteRows
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text size="sm" c="dimmed">
                            No organizations available to invite.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </>
          ) : (
            <Text size="sm" c="dimmed">
              Select an event to invite other organizations to your scouting alliance.
            </Text>
          )}
        </Stack>
      </Modal>
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
