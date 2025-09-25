import {
  useDeleteOrganizationApplication,
  useDeleteOrganizationMember,
  useOrganizationApplications,
  useOrganizationEvents,
  useOrganizationMembers,
  useUpdateOrganizationMember,
  useUserInfo,
  useUserOrganization,
  useUserRole,
  type OrganizationMemberRole,
} from '@/api';
import { Badge, Button, Group, Select, Stack, Table, Text } from '@mantine/core';
import { IconCancel, IconCheck, IconX } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  ADMIN: 'Team Admin',
  LEAD: 'Lead',
  MEMBER: 'Member',
  GUEST: 'Guest',
};

const ROLE_OPTIONS: Array<{ label: string; value: OrganizationMemberRole }> = [
  { label: 'Team Admin', value: 'ADMIN' },
  { label: 'Lead', value: 'LEAD' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Guest', value: 'GUEST' },
];

export function TeamMembersTable() {
  const { data: userInfo } = useUserInfo();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const { data: userRole } = useUserRole({ enabled: isUserLoggedIn });
  const {
    data: userOrganization,
    isLoading: isUserOrganizationLoading,
  } = useUserOrganization({ enabled: isUserLoggedIn });
  const organizationId = userOrganization?.organization_id ?? null;
  const currentUserId = userInfo?.id ?? null;
  const { data: organizationEvents = [], isLoading: isOrganizationEventsLoading } = useOrganizationEvents(
    organizationId,
    { enabled: isUserLoggedIn && !!organizationId }
  );
  const { data: organizationApplications = [], isLoading: isOrganizationApplicationsLoading } =
    useOrganizationApplications({ enabled: isUserLoggedIn && !!organizationId });
  const { mutateAsync: deleteOrganizationApplication, isPending: isDeletingOrganizationApplication } =
    useDeleteOrganizationApplication();
  const { data: organizationMembers = [], isLoading: isOrganizationMembersLoading } =
    useOrganizationMembers({ enabled: isUserLoggedIn });
  const { mutateAsync: deleteOrganizationMember, isPending: isDeletingOrganizationMember } =
    useDeleteOrganizationMember();

  const isLoadingEvents = isUserOrganizationLoading || isOrganizationEventsLoading;
  const isAdmin = userRole?.role === 'ADMIN';
  const canManageMembers = isAdmin;

  const eventOptions = useMemo(
    () =>
      (isLoadingEvents ? [] : organizationEvents).map((organizationEvent) => ({
        value: organizationEvent.eventKey,
        label: organizationEvent.short_name ?? organizationEvent.eventName,
      })),
    [isLoadingEvents, organizationEvents],
  );

  const [guestAssignments, setGuestAssignments] = useState<Record<string, string | null>>({});
  const { mutateAsync: updateOrganizationMember, isPending: isUpdatingOrganizationMember } =
    useUpdateOrganizationMember();
  const [pendingMemberUpdateUserId, setPendingMemberUpdateUserId] = useState<string | null>(null);
  const [pendingApplicationDeleteUserId, setPendingApplicationDeleteUserId] =
    useState<string | null>(null);
  const [pendingMemberDeleteUserId, setPendingMemberDeleteUserId] = useState<string | null>(null);

  const roleButtonOptions: Array<{
    label: string;
    role: OrganizationMemberRole;
  }> = [
    { label: 'Guest', role: 'GUEST' },
    { label: 'Member', role: 'MEMBER' },
    { label: 'Lead', role: 'LEAD' },
    { label: 'Team Admin', role: 'ADMIN' },
  ];

  const handleRoleUpdate = async (userId: string, role: OrganizationMemberRole) => {
    if (!canManageMembers || userId === currentUserId) {
      return;
    }

    setPendingMemberUpdateUserId(userId);
    try {
      await updateOrganizationMember({ userId, role });
    } finally {
      setPendingMemberUpdateUserId((current) => (current === userId ? null : current));
    }
  };

  const handleRevokeAccess = async (userId: string, memberRole: OrganizationMemberRole) => {
    if (!canManageMembers || userId === currentUserId || memberRole === 'ADMIN') {
      return;
    }

    setPendingMemberDeleteUserId(userId);
    try {
      await deleteOrganizationMember({ userId });
    } finally {
      setPendingMemberDeleteUserId((current) => (current === userId ? null : current));
    }
  };

  const handleRejectApplication = async (userId: string) => {
    setPendingApplicationDeleteUserId(userId);
    try {
      await deleteOrganizationApplication({ userId });
    } finally {
      setPendingApplicationDeleteUserId((current) => (current === userId ? null : current));
    }
  };

  const teamMembers = useMemo(
    () => organizationMembers.filter((member) => member.role !== 'GUEST'),
    [organizationMembers],
  );

  const guestMembers = useMemo(
    () => organizationMembers.filter((member) => member.role === 'GUEST'),
    [organizationMembers],
  );

  const memberColumnCount = canManageMembers ? 3 : 2;
  const guestColumnCount = canManageMembers ? 3 : 2;

  const renderTeamMemberRows = () => {
    if (isOrganizationMembersLoading) {
      return (
        <Table.Tr>
          <Table.Td colSpan={memberColumnCount}>
            <Text c="dimmed">Loading team members…</Text>
          </Table.Td>
        </Table.Tr>
      );
    }

    if (teamMembers.length === 0) {
      return (
        <Table.Tr>
          <Table.Td colSpan={memberColumnCount}>
            <Text c="dimmed">No team members</Text>
          </Table.Td>
        </Table.Tr>
      );
    }

    return teamMembers.map((member) => {
      const isUpdatingThisUser =
        isUpdatingOrganizationMember && pendingMemberUpdateUserId === member.userId;
      const isDeletingThisUser =
        isDeletingOrganizationMember && pendingMemberDeleteUserId === member.userId;
      const isCurrentUser = member.userId === currentUserId;
      const canRevokeAccess = canManageMembers && !isCurrentUser && member.role !== 'ADMIN';

      return (
        <Table.Tr key={member.userId}>
          <Table.Td>
            <Group gap="sm">
              <div>
                <Text fz="sm" fw={500}>
                  {member.displayName}
                </Text>
                <Text fz="xs" c="dimmed">
                  {member.email}
                </Text>
              </div>
            </Group>
          </Table.Td>
          <Table.Td>
            {canManageMembers && !isCurrentUser ? (
              <Select
                data={ROLE_OPTIONS.map(({ label, value }) => ({ label, value }))}
                value={member.role}
                onChange={(value) => {
                  if (!value || value === member.role) {
                    return;
                  }
                  void handleRoleUpdate(member.userId, value as OrganizationMemberRole);
                }}
                variant="unstyled"
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
                aria-label={`Role for ${member.displayName}`}
                disabled={isUpdatingThisUser || isDeletingThisUser}
              />
            ) : (
              <Text>{ROLE_LABELS[member.role]}</Text>
            )}
          </Table.Td>
          {canManageMembers && (
            <Table.Td>
              <Button
                color="red"
                leftSection={<IconCancel size={16} />}
                variant="light"
                loading={isDeletingThisUser}
                onClick={() => {
                  void handleRevokeAccess(member.userId, member.role);
                }}
                disabled={isUpdatingThisUser || isDeletingThisUser || !canRevokeAccess}
              >
                Revoke Access
              </Button>
            </Table.Td>
          )}
        </Table.Tr>
      );
    });
  };

  const renderGuestRows = () => {
    if (isOrganizationMembersLoading) {
      return (
        <Table.Tr>
          <Table.Td colSpan={guestColumnCount}>
            <Text c="dimmed">Loading guest members…</Text>
          </Table.Td>
        </Table.Tr>
      );
    }

    return guestMembers.map((member) => {
      const isUpdatingThisUser =
        isUpdatingOrganizationMember && pendingMemberUpdateUserId === member.userId;
      const isDeletingThisUser =
        isDeletingOrganizationMember && pendingMemberDeleteUserId === member.userId;
      const canRevokeAccess = canManageMembers && member.role !== 'ADMIN';

      return (
        <Table.Tr key={member.userId}>
          <Table.Td>
            <Group gap="sm">
              <div>
                <Text fz="sm" fw={500}>
                  {member.displayName}
                </Text>
                <Text fz="xs" c="dimmed">
                  {member.email}
                </Text>
              </div>
            </Group>
          </Table.Td>
          <Table.Td>
            <Select
              data={eventOptions}
              value={guestAssignments[member.userId] ?? null}
              onChange={(value) =>
                setGuestAssignments((current) => ({ ...current, [member.userId]: value }))
              }
              placeholder={isLoadingEvents ? 'Loading events...' : 'Select event'}
              variant="unstyled"
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
              aria-label={`Guest event for ${member.displayName}`}
              disabled={!organizationId || isLoadingEvents}
            />
          </Table.Td>
          {canManageMembers && (
            <Table.Td>
              <Group gap="xs" wrap="wrap">
                <Button
                  color="red"
                  leftSection={<IconCancel size={16} />}
                  variant="light"
                  loading={isDeletingThisUser}
                  onClick={() => {
                    void handleRevokeAccess(member.userId, member.role);
                  }}
                  disabled={
                    isUpdatingThisUser ||
                    isDeletingThisUser ||
                    !canRevokeAccess ||
                    member.userId === currentUserId
                  }
                >
                  Revoke Access
                </Button>
              </Group>
            </Table.Td>
          )}
        </Table.Tr>
      );
    });
  };

  const pendingRows = organizationApplications.map((application) => {
    const joinedDate = new Date(application.joined);
    const joinedLabel = Number.isNaN(joinedDate.getTime())
      ? '—'
      : joinedDate.toLocaleString();

    const isUpdatingThisUser =
      isUpdatingOrganizationMember && pendingMemberUpdateUserId === application.userId;
    const isDeletingThisUser =
      isDeletingOrganizationApplication && pendingApplicationDeleteUserId === application.userId;

    return (
      <Table.Tr key={application.userId}>
        <Table.Td>
          <Group gap="sm">
            <div>
              <Text fz="sm" fw={500}>
                {application.displayName}
              </Text>
              <Text fz="xs" c="dimmed">
                {application.email}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <Badge variant="light">{application.role}</Badge>
        </Table.Td>
        <Table.Td>{joinedLabel}</Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="wrap">
            {canManageMembers &&
              roleButtonOptions.map((option) => (
                <Button
                  key={option.role}
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  variant="light"
                  loading={isUpdatingThisUser}
                  onClick={() => {
                    void handleRoleUpdate(application.userId, option.role);
                  }}
                  disabled={isUpdatingThisUser || isDeletingThisUser}
                >
                  {option.label}
                </Button>
              ))}
            {canManageMembers && (
              <Button
                color="red"
                leftSection={<IconX size={16} />}
                variant="light"
                loading={isDeletingThisUser}
                onClick={() => {
                  void handleRejectApplication(application.userId);
                }}
                disabled={isDeletingThisUser || isUpdatingThisUser}
              >
                Reject
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="lg">
      <Table.ScrollContainer minWidth={800}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Team Member</Table.Th>
              <Table.Th>Role</Table.Th>
              {canManageMembers && <Table.Th>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{renderTeamMemberRows()}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {guestMembers.length > 0 && (
        <div>
          <Text fw={600} mb="sm">
            Guest Members
          </Text>
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Guest</Table.Th>
                  <Table.Th>Guest Event</Table.Th>
                  {canManageMembers && <Table.Th>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{renderGuestRows()}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>
      )}

      {(isOrganizationApplicationsLoading || organizationApplications.length > 0) && (
        <div>
          <Text fw={600} mb="sm">
            Pending Users
          </Text>
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Applied</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isOrganizationApplicationsLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed">Loading pending users…</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  pendingRows
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </div>
      )}
    </Stack>
  );
}