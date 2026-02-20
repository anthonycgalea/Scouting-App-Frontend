import { useEffect, useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Box, Button, Group, ScrollArea, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  type EventSummary,
  type OrganizationEventDetail,
  useCreateOrganizationEvent,
  useEvents,
  useOrganizationEvents,
  useUserInfo,
  useUserOrganization,
} from '../api';
import { getEventWeekLabel } from '@/utils/eventWeek';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

const ALLOWED_EVENT_YEARS = [2026, 2025] as const;

export function AddEventPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const navigate = useNavigate({ from: '/eventSelect/add' });
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const {
    data: userOrganization,
    isLoading: isUserOrganizationLoading,
    isError: isUserOrganizationError,
  } = useUserOrganization({ enabled: isUserLoggedIn });
  const organizationId = userOrganization?.organization_id ?? null;
  const {
    data: organizationEvents,
    isLoading: isOrganizationEventsLoading,
    isError: isOrganizationEventsError,
  } = useOrganizationEvents({ enabled: isUserLoggedIn && !!organizationId });
  const organizationEventList: OrganizationEventDetail[] = organizationEvents ?? [];
  const allowedEventYearSet = useMemo(
    () => new Set<number>(ALLOWED_EVENT_YEARS),
    []
  );
  const fallbackYearNumber = useMemo(() => ALLOWED_EVENT_YEARS[0], []);
  const [selectedYear, setSelectedYear] = useState<string>(
    fallbackYearNumber.toString()
  );
  const [hasUserSelectedYear, setHasUserSelectedYear] = useState(false);

  useEffect(() => {
    const fallbackValue = fallbackYearNumber.toString();

    if (!hasUserSelectedYear) {
      if (selectedYear !== fallbackValue) {
        setSelectedYear(fallbackValue);
      }
      return;
    }

    const parsedYear = Number.parseInt(selectedYear, 10);
    if (Number.isNaN(parsedYear) || !allowedEventYearSet.has(parsedYear)) {
      setSelectedYear(fallbackValue);
      setHasUserSelectedYear(false);
    }
  }, [allowedEventYearSet, fallbackYearNumber, hasUserSelectedYear, selectedYear]);

  const selectedYearNumber = Number.parseInt(selectedYear, 10);
  const eventYearForQuery = Number.isNaN(selectedYearNumber)
    ? fallbackYearNumber
    : selectedYearNumber;

  const {
    data: events,
    isLoading,
    isError,
  } = useEvents(eventYearForQuery);

  const {
    mutate: createOrganizationEvent,
    isPending: isCreatingOrganizationEvent,
  } = useCreateOrganizationEvent();

  const [pendingEventKey, setPendingEventKey] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');

  useEffect(() => {
    setSelectedWeek('all');
  }, [eventYearForQuery]);

  const eventList: EventSummary[] = events ?? [];

  const yearOptions = useMemo(() => {
    return ALLOWED_EVENT_YEARS.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    }));
  }, []);

  const handleYearChange = (value: string | null) => {
    if (!value) {
      setHasUserSelectedYear(false);
      setSelectedYear(fallbackYearNumber.toString());
      return;
    }

    setHasUserSelectedYear(true);
    setSelectedYear(value);
  };

  const existingEventKeys = useMemo(
    () => new Set(organizationEventList.map((event) => event.eventKey)),
    [organizationEventList]
  );

  const weekOptions = useMemo(() => {
    const weeks = Array.from(
      new Set(
        eventList
          .map((event) => event.week)
          .filter((week): week is number => typeof week === 'number')
      )
    ).sort((a, b) => a - b);

    return [
      { value: 'all', label: 'All Weeks' },
      ...weeks.map((week) => ({
        value: week.toString(),
        label: week === 0 ? 'Preseason' : getEventWeekLabel(week, { placeholder: '' }),
      })),
    ];
  }, [eventList]);

  const sortedFilteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredEvents = eventList.filter((event) => {
      if (existingEventKeys.has(event.event_key)) {
        return false;
      }

      const matchesSearch = event.event_name
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesWeek =
        selectedWeek === 'all' || (event.week?.toString() ?? '') === selectedWeek;

      return matchesSearch && matchesWeek;
    });

    const getComparableWeek = (week: number | null | undefined) =>
      typeof week === 'number' ? week : Number.MAX_SAFE_INTEGER;

    return filteredEvents.sort((a, b) => {
      const weekDifference = getComparableWeek(a.week) - getComparableWeek(b.week);

      if (weekDifference !== 0) {
        return weekDifference;
      }

      return a.event_name.localeCompare(b.event_name);
    });
  }, [eventList, existingEventKeys, searchTerm, selectedWeek]);

  const handleAddEvent = (eventKey: string) => {
    if (!organizationId) {
      return;
    }

    setPendingEventKey(eventKey);
    createOrganizationEvent(
      { OrganizationId: organizationId, EventKey: eventKey },
      {
        onSuccess: () => {
          navigate({ to: '/eventSelect' });
        },
        onSettled: () => {
          setPendingEventKey(null);
        },
      }
    );
  };

  const rows = sortedFilteredEvents.map((event) => {
    const isPendingForRow = isCreatingOrganizationEvent && pendingEventKey === event.event_key;

    return (
      <Table.Tr key={event.event_key}>
        <Table.Td>
          <Text size="sm" fw={500}>
            {event.event_name}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{getEventWeekLabel(event.week)}</Text>
        </Table.Td>
        <Table.Td>
          <Button
            variant="light"
            leftSection={<IconPlus stroke={1.5} />}
            onClick={() => handleAddEvent(event.event_key)}
            loading={isPendingForRow}
            disabled={!organizationId || (isCreatingOrganizationEvent && !isPendingForRow)}
          >
            Add
          </Button>
        </Table.Td>
      </Table.Tr>
    );
  });

  const isLoadingEvents = isLoading || isUserOrganizationLoading || isOrganizationEventsLoading;
  const isErrorLoadingEvents = isError || isUserOrganizationError || isOrganizationEventsError;
  const shouldPromptForOrganization =
    !isLoadingEvents && !isErrorLoadingEvents && isUserLoggedIn && !organizationId;

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Available Events</Title>
      </Group>
      <Group mb="md" gap="md" wrap="wrap">
        <TextInput
          label="Event Name"
          placeholder="Search events"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          style={{ minWidth: 240 }}
        />
        <Select
          label="Year"
          data={yearOptions}
          value={selectedYear}
          onChange={handleYearChange}
          style={{ width: 160 }}
        />
        <Select
          label="Week"
          data={weekOptions}
          value={selectedWeek}
          onChange={(value) => setSelectedWeek(value ?? 'all')}
          style={{ width: 160 }}
        />
      </Group>
      <ScrollArea>
        <Table miw={700} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event Name</Table.Th>
              <Table.Th>Week</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoadingEvents ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    Loading events...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : isErrorLoadingEvents ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="red">
                    Unable to load events. Please try again later.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : shouldPromptForOrganization ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    Select an organization to manage its events.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    No events found for {eventYearForQuery}.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
}
