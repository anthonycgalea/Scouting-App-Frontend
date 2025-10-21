import { useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useAllOrganizations, useCreateOrganization, type Organization } from '@/api';
import { useRequireSiteAdminAccess } from '@/hooks/useRequireSiteAdminAccess';

export function SiteAdminOrganizationsPage() {
  const { canAccessSiteAdminPages, isCheckingAccess } = useRequireSiteAdminAccess();
  const { data: organizations, isLoading, isError } = useAllOrganizations({
    enabled: canAccessSiteAdminPages,
  });
  const createOrganizationMutation = useCreateOrganization();

  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [teamNumber, setTeamNumber] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (isCheckingAccess || !canAccessSiteAdminPages) {
    return null;
  }

  const organizationList: Organization[] = useMemo(
    () => organizations ?? [],
    [organizations],
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
    [filteredOrganizations],
  );

  const handleCloseCreateModal = () => {
    if (!createOrganizationMutation.isPending) {
      setCreateModalOpened(false);
      setOrganizationName('');
      setTeamNumber('');
      setFormError(null);
    }
  };

  const handleSubmitCreateOrganization = async () => {
    setFormError(null);
    setFeedback(null);

    const trimmedName = organizationName.trim();
    if (teamNumber === '') {
      setFormError('Team number is required.');
      return;
    }

    const numericTeamNumber = typeof teamNumber === 'number' ? teamNumber : Number(teamNumber);

    if (!trimmedName) {
      setFormError('Organization name is required.');
      return;
    }

    if (!Number.isFinite(numericTeamNumber) || Number.isNaN(numericTeamNumber)) {
      setFormError('Team number must be a valid number.');
      return;
    }

    if (numericTeamNumber < 0) {
      setFormError('Team number must be zero or a positive number.');
      return;
    }

    try {
      await createOrganizationMutation.mutateAsync({
        name: trimmedName,
        team_number: Math.trunc(numericTeamNumber),
      });
      setFeedback({
        type: 'success',
        message: 'Organization created successfully.',
      });
      setCreateModalOpened(false);
      setOrganizationName('');
      setTeamNumber('');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create organization', error);
      setFeedback({
        type: 'error',
        message: 'Failed to create organization. Please try again.',
      });
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
    </Table.Tr>
  ));

  return (
    <Box p="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Organizations</Title>
        <Button
          leftSection={<IconPlus stroke={1.5} />}
          onClick={() => {
            setCreateModalOpened(true);
            setOrganizationName('');
            setTeamNumber('');
            setFormError(null);
            setFeedback(null);
          }}
        >
          Create Organization
        </Button>
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
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={2}>
                  <Text size="sm" c="dimmed">
                    Loading organizations...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={2}>
                  <Text size="sm" c="red">
                    Unable to load organizations. Please try again later.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={2}>
                  <Text size="sm" c="dimmed">
                    No organizations found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Modal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        title="Create Organization"
        centered
      >
        <Box component="form" onSubmit={(event) => {
          event.preventDefault();
          void handleSubmitCreateOrganization();
        }}>
          <TextInput
            label="Name"
            placeholder="Enter organization name"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.currentTarget.value)}
            required
            mb="md"
          />
          <NumberInput
            label="Team Number"
            placeholder="Enter team number"
            value={teamNumber}
            onChange={(value) => {
              if (typeof value === 'number') {
                setTeamNumber(Number.isNaN(value) ? '' : value);
              } else if (value === '' || value === null || value === undefined) {
                setTeamNumber('');
              } else {
                const parsedValue = Number.parseInt(value, 10);
                setTeamNumber(Number.isNaN(parsedValue) ? '' : parsedValue);
              }
            }}
            min={0}
            required
            mb="md"
          />
          {formError ? (
            <Alert color="red" mb="md" variant="light">
              {formError}
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={handleCloseCreateModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createOrganizationMutation.isPending}>
              Submit
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
}
