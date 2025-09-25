import {
  useOrganizationApplications,
  useOrganizationEvents,
  useDeleteOrganizationApplication,
  useUpdateOrganizationMember,
  useUserInfo,
  useUserOrganization,
  useUserRole,
  type OrganizationMemberRole,
} from '@/api';
import { Badge, Button, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
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
  const { data: userRole } = useUserRole({ enabled: isUserLoggedIn });
  const {
    data: userOrganization,
    isLoading: isUserOrganizationLoading,
  } = useUserOrganization({ enabled: isUserLoggedIn });
  const organizationId = userOrganization?.organization_id ?? null;
  const { data: organizationEvents = [], isLoading: isOrganizationEventsLoading } = useOrganizationEvents(
    organizationId,
    { enabled: isUserLoggedIn && !!organizationId }
  );
  const { data: organizationApplications = [], isLoading: isOrganizationApplicationsLoading } =
    useOrganizationApplications({ enabled: isUserLoggedIn && !!organizationId });
  const { mutateAsync: deleteOrganizationApplication, isPending: isDeletingOrganizationApplication } =
    useDeleteOrganizationApplication();

  const isLoadingEvents = isUserOrganizationLoading || isOrganizationEventsLoading;
  const isAdmin = userRole?.role === 'ADMIN';

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

  const roleButtonOptions: Array<{
    label: string;
    role: OrganizationMemberRole;
    requiresAdmin?: boolean;
  }> = [
    { label: 'Guest', role: 'GUEST' },
    { label: 'Member', role: 'MEMBER' },
    { label: 'Lead', role: 'LEAD', requiresAdmin: true },
    { label: 'Team Admin', role: 'ADMIN', requiresAdmin: true },
  ];

  const handleRoleUpdate = async (userId: string, role: OrganizationMemberRole) => {
    setPendingMemberUpdateUserId(userId);
    try {
      await updateOrganizationMember({ userId, role });
    } finally {
      setPendingMemberUpdateUserId((current) => (current === userId ? null : current));
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
            {roleButtonOptions
              .filter((option) => !option.requiresAdmin || isAdmin)
              .map((option) => (
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
              <Table.Th>Guest Event</Table.Th>
              <Table.Th>Last active</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>

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
              ) : pendingRows.length > 0 ? (
                pendingRows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed">No pending users</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </Stack>
  );
}