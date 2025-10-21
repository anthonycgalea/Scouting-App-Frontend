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
import {
  useAdminUsers,
  useAllOrganizations,
  useCreateOrganization,
  useManageOrganizationMember,
  type AdminUser,
  type Organization,
} from '@/api';
import { useRequireSiteAdminAccess } from '@/hooks/useRequireSiteAdminAccess';

export function SiteAdminOrganizationsPage() {
  const { canAccessSiteAdminPages, isCheckingAccess } = useRequireSiteAdminAccess();
  const { data: organizations, isLoading, isError } = useAllOrganizations({
    enabled: canAccessSiteAdminPages,
  });
  const {
    data: adminUsers,
    isLoading: isLoadingAdminUsers,
    isError: isAdminUsersError,
  } = useAdminUsers({
    enabled: canAccessSiteAdminPages,
  });
  const createOrganizationMutation = useCreateOrganization();
  const manageOrganizationMemberMutation = useManageOrganizationMember();

  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [teamNumber, setTeamNumber] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [addTeamAdminModalOpened, setAddTeamAdminModalOpened] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [manageMemberFeedback, setManageMemberFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [selectedUserForMutation, setSelectedUserForMutation] = useState<string | null>(null);

  if (isCheckingAccess || !canAccessSiteAdminPages) {
    return null;
  }

  const organizationList: Organization[] = useMemo(
    () => organizations ?? [],
    [organizations],
  );

  const adminUserList: AdminUser[] = useMemo(
    () => adminUsers ?? [],
    [adminUsers],
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

  const filteredAdminUsers = useMemo(() => {
    const normalizedSearch = userSearchTerm.trim().toLowerCase();

    const list = adminUserList;

    if (!normalizedSearch) {
      return list.toSorted((a, b) => {
        const aName = a.display_name ?? a.email;
        const bName = b.display_name ?? b.email;

        return aName.localeCompare(bName);
      });
    }

    return list
      .filter((user) => {
        const displayName = user.display_name ?? '';
        const matchesDisplayName = displayName.toLowerCase().includes(normalizedSearch);
        const matchesEmail = user.email.toLowerCase().includes(normalizedSearch);

        return matchesDisplayName || matchesEmail;
      })
      .toSorted((a, b) => {
        const aName = a.display_name ?? a.email;
        const bName = b.display_name ?? b.email;

        return aName.localeCompare(bName);
      });
  }, [adminUserList, userSearchTerm]);

  const handleCloseAddTeamAdminModal = () => {
    if (!manageOrganizationMemberMutation.isPending) {
      setAddTeamAdminModalOpened(false);
      setSelectedOrganization(null);
      setUserSearchTerm('');
      setManageMemberFeedback(null);
      setSelectedUserForMutation(null);
    }
  };

  const handleAddTeamAdmin = async (userId: string) => {
    if (!selectedOrganization) {
      return;
    }

    setSelectedUserForMutation(userId);
    setManageMemberFeedback(null);

    try {
      await manageOrganizationMemberMutation.mutateAsync({
        user_id: userId,
        organization_id: selectedOrganization.id,
      });

      const addedUser = adminUserList.find((user) => user.id === userId);
      const displayName = addedUser?.display_name ?? addedUser?.email ?? 'User';

      setFeedback({
        type: 'success',
        message: `${displayName} added as a team admin for ${selectedOrganization.name}.`,
      });

      handleCloseAddTeamAdminModal();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add team admin', error);
      setManageMemberFeedback({
        type: 'error',
        message: 'Failed to add team admin. Please try again.',
      });
    } finally {
      setSelectedUserForMutation(null);
    }
  };

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
          <Table.Td>
            <Group justify="flex-end">
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  setSelectedOrganization(organization);
                  setAddTeamAdminModalOpened(true);
                  setManageMemberFeedback(null);
                  setUserSearchTerm('');
                }}
              >
                Add Team Admin
              </Button>
            </Group>
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
      <Modal
        opened={addTeamAdminModalOpened}
        onClose={handleCloseAddTeamAdminModal}
        title={
          selectedOrganization
            ? `Add Team Admin — ${selectedOrganization.name}`
            : 'Add Team Admin'
        }
        centered
        size="xl"
      >
        {selectedOrganization ? (
          <Box>
            <Text size="sm" mb="sm">
              Select a user to add as a team admin for {selectedOrganization.name}.
            </Text>
            <TextInput
              label="Search Users"
              placeholder="Search by name or email"
              value={userSearchTerm}
              onChange={(event) => setUserSearchTerm(event.currentTarget.value)}
              mb="md"
            />
            {manageMemberFeedback ? (
              <Alert
                color={manageMemberFeedback.type === 'success' ? 'green' : 'red'}
                mb="md"
                variant="light"
              >
                {manageMemberFeedback.message}
              </Alert>
            ) : null}
            {isLoadingAdminUsers ? (
              <Text size="sm" c="dimmed">
                Loading users...
              </Text>
            ) : isAdminUsersError ? (
              <Text size="sm" c="red">
                Unable to load users. Please try again later.
              </Text>
            ) : filteredAdminUsers.length === 0 ? (
              <Text size="sm" c="dimmed">
                No users found.
              </Text>
            ) : (
              <ScrollArea h={240}>
                <Table verticalSpacing="sm" miw={500}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredAdminUsers.map((user) => {
                      const userName = user.display_name ?? user.email;

                      return (
                        <Table.Tr key={user.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {userName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {user.auth_provider}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{user.email}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group justify="flex-end">
                              <Button
                                variant="light"
                                size="xs"
                                loading={
                                  manageOrganizationMemberMutation.isPending &&
                                  selectedUserForMutation === user.id
                                }
                                onClick={() => {
                                  void handleAddTeamAdmin(user.id);
                                }}
                              >
                                Add
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Box>
        ) : (
          <Text size="sm" c="dimmed">
            No organization selected.
          </Text>
        )}
      </Modal>
    </Box>
  );
}
