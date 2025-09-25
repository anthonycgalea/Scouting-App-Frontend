import { useMemo, useState } from 'react';
import { IconMail } from '@tabler/icons-react';
import { Box, Button, Group, ScrollArea, Table, Text, TextInput, Title } from '@mantine/core';
import { type Organization, useAllOrganizations } from '@/api';

export function ApplyToOrganizationPage() {
  const { data: organizations, isLoading, isError } = useAllOrganizations();
  const [searchTerm, setSearchTerm] = useState('');

  const organizationList: Organization[] = organizations ?? [];

  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return organizationList;
    }

    return organizationList.filter((organization) => {
      const matchesName = organization.name.toLowerCase().includes(normalizedSearch);
      const matchesTeamNumber = organization.team_number
        .toString()
        .includes(normalizedSearch);

      return matchesName || matchesTeamNumber;
    });
  }, [organizationList, searchTerm]);

  const sortedOrganizations = useMemo(
    () =>
      filteredOrganizations.toSorted((a, b) => {
        if (a.team_number !== b.team_number) {
          return a.team_number - b.team_number;
        }

        return a.name.localeCompare(b.name);
      }),
    [filteredOrganizations]
  );

  const rows = sortedOrganizations.map((organization) => (
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
        <Button variant="light" leftSection={<IconMail stroke={1.5} />}>Apply</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box p="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Available Organizations</Title>
      </Group>
      <Group mb="md" gap="md" wrap="wrap">
        <TextInput
          label="Search"
          placeholder="Search organizations"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          style={{ minWidth: 240 }}
        />
      </Group>
      <ScrollArea>
        <Table miw={700} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Organization</Table.Th>
              <Table.Th>Team</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    Loading organizations...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="red">
                    Unable to load organizations. Please try again later.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">
                    No organizations found.
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
