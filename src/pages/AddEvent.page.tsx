import { IconPlus } from '@tabler/icons-react';
import { ActionIcon, Box, Group, ScrollArea, Table, Text, Title } from '@mantine/core';

type AvailableEvent = {
  id: string;
  name: string;
  week: number;
  teamCount: number;
  isPublic: boolean;
};

const availableEvents: AvailableEvent[] = [
  {
    id: 'tx-san-antonio-1',
    name: 'San Antonio District #1',
    week: 2,
    teamCount: 38,
    isPublic: true,
  },
  {
    id: 'tx-el-paso',
    name: 'El Paso Regional',
    week: 3,
    teamCount: 42,
    isPublic: false,
  },
  {
    id: 'tx-lubbock',
    name: 'Lubbock District',
    week: 4,
    teamCount: 36,
    isPublic: true,
  },
];

export function AddEventPage() {
  const rows = availableEvents.map((event) => (
    <Table.Tr key={event.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {event.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">Week {event.week}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{event.teamCount}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{event.isPublic ? 'Yes' : 'No'}</Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="default" size="xl" radius="md" aria-label={`Add ${event.name}`}>
          <IconPlus stroke={1.5} />
        </ActionIcon>
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
              <Table.Th>Public</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
}
