import { useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Box, Button, Group, ScrollArea, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { type EventSummary, useEvents } from '../api';

export function AddEventPage() {
  const currentYear = new Date().getFullYear();
  const {
    data: events,
    isLoading,
    isError,
  } = useEvents(currentYear);

  const eventList: EventSummary[] = events ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');

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
      ...weeks.map((week) => ({ value: week.toString(), label: `Week ${week}` })),
    ];
  }, [eventList]);

  const sortedFilteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredEvents = eventList.filter((event) => {
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
  }, [eventList, searchTerm, selectedWeek]);

  const rows = sortedFilteredEvents.map((event) => (
    <Table.Tr key={event.event_key}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {event.event_name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">Week {event.week}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          —
        </Text>
      </Table.Td>
      <Table.Td>
        <Button variant="light" leftSection={<IconPlus stroke={1.5} />}> 
          Add
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

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
          label="Week"
          data={weekOptions}
          value={selectedWeek}
          onChange={(value) => setSelectedWeek(value ?? 'all')}
          style={{ width: 160 }}
        />
      </Group>
      <ScrollArea>
        <Table miw={800} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event Name</Table.Th>
              <Table.Th>Week</Table.Th>
              <Table.Th>Team Count</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    Loading events...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="red">
                    Unable to load events. Please try again later.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No events found for {currentYear}.
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
