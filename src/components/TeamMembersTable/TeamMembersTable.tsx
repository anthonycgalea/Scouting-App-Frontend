import { Avatar, Badge, Group, Select, Table, Text } from '@mantine/core';

const data = [
  {
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png',
    name: 'Robert Wolfkisser',
    job: 'Team Admin',
    email: 'rob_wolf@gmail.com',
    role: 'Team Admin',
    lastActive: '2 days ago',
    active: true,
  },
  {
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-6.png',
    name: 'Jill Jailbreaker',
    job: 'Member',
    email: 'jj@breaker.com',
    role: 'Member',
    lastActive: '6 days ago',
    active: true,
  },
  {
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-10.png',
    name: 'Henry Silkeater',
    job: 'Guest',
    email: 'henry@silkeater.io',
    role: 'Guest',
    lastActive: '2 days ago',
    active: false,
  },
  {
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png',
    name: 'Bill Horsefighter',
    job: 'Member',
    email: 'bhorsefighter@gmail.com',
    role: 'Member',
    lastActive: '5 days ago',
    active: true,
  },
  {
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-3.png',
    name: 'Jeremy Footviewer',
    job: 'Lead Scout',
    email: 'jeremy@foot.dev',
    role: 'Lead Scout',
    lastActive: '3 days ago',
    active: false,
  },
];

const rolesData = ['Team Admin', 'Lead Scout', 'Member', 'Guest'];

export function TeamMembersTable() {
  const rows = data.map((item) => (
    <Table.Tr key={item.name}>
      <Table.Td>
        <Group gap="sm">
          <Avatar size={40} src={item.avatar} radius={40} />
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
            <Table.Th>Last active</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}