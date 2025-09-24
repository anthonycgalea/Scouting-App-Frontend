import { useEffect, useState } from 'react';
import cx from 'clsx';
import { Button, Checkbox, ScrollArea, Stack, Switch, Table, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { type OrganizationEventDetail, useOrganizationEvents } from '@/api';
import classes from './EventSelect.module.css';

export function EventSelect() {
  const organizationId = 4;
  const { data, isLoading, isError } = useOrganizationEvents(organizationId);
  const [events, setEvents] = useState<OrganizationEventDetail[]>([]);

  useEffect(() => {
    if (data) {
      setEvents(data);
    }
  }, [data]);

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

  const rows = events.map((event) => {
    const selected = activeEventId === event.eventKey;
    return (
      <Table.Tr key={event.eventKey} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox
            aria-label={`Set ${event.eventName} as the active event`}
            checked={selected}
            onChange={() => setActiveEventId(event.eventKey)}
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {event.eventName}
          </Text>
        </Table.Td>
        <Table.Td>
          <Switch
            aria-label={`Toggle public visibility for ${event.eventName}`}
            checked={event.isPublic}
            onChange={() => toggleEventPublic(event.eventKey)}
          />
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack>
      <ScrollArea>
        <Table miw={600} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>Active</Table.Th>
              <Table.Th>Event Name</Table.Th>
              <Table.Th>Public</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    Loading events...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="red">
                    Unable to load events. Please try again later.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    No events have been added yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Button component={Link} to="/eventSelect/add" variant="light">
        Add Event
      </Button>
    </Stack>
  );
}