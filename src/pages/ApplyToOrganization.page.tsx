import { useMemo, useState } from 'react';
import { IconMail } from '@tabler/icons-react';
import { Alert, Box, Button, Group, ScrollArea, Table, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  type Organization,
  useAllOrganizations,
  useApplyToOrganization,
  useOrganizations,
} from '@/api';

export function ApplyToOrganizationPage() {
  const { data: organizations, isLoading, isError } = useAllOrganizations();
  const { data: userOrganizations } = useOrganizations();
  const applyMutation = useApplyToOrganization();
  const navigate = useNavigate({ from: '/organizations/apply' });
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingOrganizationId, setPendingOrganizationId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const joinedOrganizationIds = useMemo(
    () => new Set((userOrganizations ?? []).map((organization) => organization.id)),
    [userOrganizations]
  );

  const organizationList: Organization[] = useMemo(
    () => (organizations ?? []).filter((organization) => !joinedOrganizationIds.has(organization.id)),
    [organizations, joinedOrganizationIds]
  );

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

  const handleApply = async (organizationId: number) => {
    setFeedback(null);
    setPendingOrganizationId(organizationId);

    try {
      await applyMutation.mutateAsync(organizationId);
      navigate({ to: '/userSettings' });
    } catch (error) {
      console.error('Failed to submit organization application', error);
      setFeedback({
        type: 'error',
        message: 'Failed to submit application. Please try again.',
      });
    } finally {
      setPendingOrganizationId(null);
    }
  };
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
        <Button
          variant="light"
          leftSection={<IconMail stroke={1.5} />}
          loading={pendingOrganizationId === organization.id && applyMutation.isPending}
          onClick={() => handleApply(organization.id)}
        >
          Apply
        </Button>
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
      {feedback ? (
        <Alert color={feedback.type === 'success' ? 'green' : 'red'} mb="md" variant="light">
          {feedback.message}
        </Alert>
      ) : null}
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
