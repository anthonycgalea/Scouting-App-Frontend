import { IconPlus } from '@tabler/icons-react';
import { Box, Button, Group, ScrollArea, Table, Text, Title } from '@mantine/core';
import { type EventSummary, useEvents } from '../api';

export function AddEventPage() {
  const currentYear = new Date().getFullYear();
  const {
    data: events,
    isLoading,
    isError,
  } = useEvents(currentYear);

  const eventList: EventSummary[] = events ?? [];

  const rows = eventList.map((event) => (
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
          Add event to Organization
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box p="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Available Events</Title>
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
