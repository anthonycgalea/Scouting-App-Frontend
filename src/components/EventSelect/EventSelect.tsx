import { useState } from 'react';
import cx from 'clsx';
import { Button, Checkbox, ScrollArea, Stack, Switch, Table, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import classes from './EventSelect.module.css';

type EventRow = {
  id: string;
  name: string;
  week: number;
  teamCount: number;
  isPublic: boolean;
};

const initialEvents: EventRow[] = [
  {
    id: 'tx-houston-1',
    name: 'Houston District #1',
    week: 1,
    teamCount: 48,
    isPublic: true,
  },
  {
    id: 'tx-dallas-1',
    name: 'Dallas Regional',
    week: 2,
    teamCount: 56,
    isPublic: true,
  },
  {
    id: 'tx-austin-1',
    name: 'Austin District #1',
    week: 3,
    teamCount: 40,
    isPublic: false,
  },
  {
    id: 'tx-houston-2',
    name: 'Houston District #2',
    week: 4,
    teamCount: 44,
    isPublic: false,
  },
];

export function EventSelect() {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialEvents[0]?.id ?? '');

  const toggleEventPublic = (id: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === id ? { ...event, isPublic: !event.isPublic } : event
      )
    );
  };

  const rows = events.map((event) => {
    const selected = activeEventId === event.id;
    return (
      <Table.Tr key={event.id} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox
            aria-label={`Set ${event.name} as the active event`}
            checked={selected}
            onChange={() => setActiveEventId(event.id)}
          />
        </Table.Td>
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
          <Switch
            aria-label={`Toggle public visibility for ${event.name}`}
            checked={event.isPublic}
            onChange={() => toggleEventPublic(event.id)}
          />
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack>
      <ScrollArea>
        <Table miw={800} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>Active</Table.Th>
              <Table.Th>Event Name</Table.Th>
              <Table.Th>Week</Table.Th>
              <Table.Th>Team Count</Table.Th>
              <Table.Th>Public</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
      <Button component={Link} to="/eventSelect/add" variant="light">
        Add Event
      </Button>
    </Stack>
  );
}