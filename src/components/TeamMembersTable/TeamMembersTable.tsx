import { useOrganizationEvents, useUserInfo, useUserOrganization } from '@/api';
import { Badge, Group, Select, Table, Text, TextInput } from '@mantine/core';
import { useMemo, useState } from 'react';

const data = [
  {
    name: 'Robert Wolfkisser',
    email: 'rob_wolf@gmail.com',
    role: 'Team Admin',
    lastActive: '2 days ago',
    active: true,
  },
  {
    name: 'Jill Jailbreaker',
    email: 'jj@breaker.com',
    role: 'Member',
    lastActive: '6 days ago',
    active: true,
  },
  {
    name: 'Henry Silkeater',
    email: 'henry@silkeater.io',
    role: 'Guest',
    lastActive: '2 days ago',
    active: false,
  },
  {
    name: 'Bill Horsefighter',
    email: 'bhorsefighter@gmail.com',
    role: 'Member',
    lastActive: '5 days ago',
    active: true,
  },
  {
    name: 'Jeremy Footviewer',
    email: 'jeremy@foot.dev',
    role: 'Lead Scout',
    lastActive: '3 days ago',
    active: false,
  },
];

const rolesData = ['Team Admin', 'Lead Scout', 'Member', 'Guest'];

export function TeamMembersTable() {
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const {
    data: userOrganization,
    isLoading: isUserOrganizationLoading,
  } = useUserOrganization({ enabled: isUserLoggedIn });
  const organizationId = userOrganization?.organization_id ?? null;
  const { data: organizationEvents = [], isLoading: isOrganizationEventsLoading } = useOrganizationEvents(
    organizationId,
    { enabled: isUserLoggedIn && !!organizationId }
  );

  const isLoadingEvents = isUserOrganizationLoading || isOrganizationEventsLoading;

  const eventOptions = useMemo(
    () =>
      (isLoadingEvents ? [] : organizationEvents).map((organizationEvent) => ({
        value: organizationEvent.eventKey,
        label: organizationEvent.short_name ?? organizationEvent.eventName,
      })),
    [isLoadingEvents, organizationEvents],
  );

  const [guestAssignments, setGuestAssignments] = useState<Record<string, string | null>>({});

  const rows = data.map((item) => (
    <Table.Tr key={item.name}>
      <Table.Td>
        <Group gap="sm">
          <div>
            <Text fz="sm" fw={500}>
              {item.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {item.email}
            </Text>
          </div>
        </Group>
      </Table.Td>

      <Table.Td>
        <Select
          data={rolesData}
          defaultValue={item.role}
          variant="unstyled"
          allowDeselect={false}
        />
      </Table.Td>
      <Table.Td>
        {item.role === 'Guest' ? (
          <Select
            data={eventOptions}
            value={guestAssignments[item.email] ?? null}
            onChange={(value) =>
              setGuestAssignments((current) => ({ ...current, [item.email]: value }))
            }
            placeholder={isLoadingEvents ? 'Loading events...' : 'Select event'}
            variant="unstyled"
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
            aria-label={`Guest event for ${item.name}`}
            disabled={!organizationId || isLoadingEvents}
          />
        ) : (
          <TextInput
            value=""
            readOnly
            disabled
            variant="unstyled"
            aria-label={`No guest event for ${item.name}`}
          />
        )}
      </Table.Td>
      <Table.Td>{item.lastActive}</Table.Td>
      <Table.Td>
        {item.active ? (
          <Badge fullWidth variant="light">
            Active
          </Badge>
        ) : (
          <Badge color="gray" fullWidth variant="light">
            Disabled
          </Badge>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Team Member</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Guest Event</Table.Th>
            <Table.Th>Last active</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}