import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOrganizations,
  useUpdateUserDisplayName,
  useUpdateUserOrganization,
  useUserInfo,
  userRoleQueryKey,
} from '../api';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function UserSettingsPage() {
  const { data: organizations, isLoading, isError } = useOrganizations();
  const { data: userInfo } = useUserInfo();
  const { mutateAsync: updateUserOrganization } = useUpdateUserOrganization();
  const { mutateAsync: updateUserDisplayName, isPending: isUpdatingDisplayName } =
    useUpdateUserDisplayName();
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: '/userSettings' });
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const [selectedUserOrganizationId, setSelectedUserOrganizationId] = useState<string | null>(null);
  const [hasUserSelectedOrganization, setHasUserSelectedOrganization] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [hasUserEditedDisplayName, setHasUserEditedDisplayName] = useState(false);

  const organizationOptions = useMemo(
    () =>
      (organizations ?? []).map((organization) => ({
        value: organization.user_organization_id.toString(),
        label: `${organization.name} (Team ${organization.team_number})`,
      })),
    [organizations]
  );

  const defaultUserOrganizationId = useMemo(() => {
    if (!isUserLoggedIn || !organizations || organizations.length === 0) {
      return null;
    }

    const userOrganizationId =
      userInfo?.user_org;

    if (userOrganizationId === null || userOrganizationId === undefined) {
      return null;
    }

    const matchingOrganization = organizations.find(
      (organization) => organization.user_organization_id === userOrganizationId
    );

    return matchingOrganization ? matchingOrganization.user_organization_id.toString() : null;
  }, [isUserLoggedIn, organizations, userInfo]);

  useEffect(() => {
    if (!isUserLoggedIn || hasUserSelectedOrganization) {
      return;
    }

    setSelectedUserOrganizationId(defaultUserOrganizationId);
  }, [defaultUserOrganizationId, hasUserSelectedOrganization, isUserLoggedIn]);

  const defaultDisplayName = useMemo(() => {
    if (!userInfo) {
      return '';
    }

    return (
      userInfo.display_name ??
      userInfo.displayName ??
      userInfo.full_name ??
      userInfo.name ??
      userInfo.username ??
      userInfo.user_name ??
      ''
    );
  }, [userInfo]);

  useEffect(() => {
    if (hasUserEditedDisplayName) {
      return;
    }

    setDisplayName(defaultDisplayName);
  }, [defaultDisplayName, hasUserEditedDisplayName]);

  const handleOrganizationChange = async (value: string | null) => {
    setHasUserSelectedOrganization(true);
    setSelectedUserOrganizationId(value);
    const userOrganizationId = value ? Number.parseInt(value, 10) : null;

    const redirectToHome = () => {
      void navigate({ to: '/' });
    };

    const parsedUserOrganizationId =
      userOrganizationId === null || Number.isNaN(userOrganizationId) ? null : userOrganizationId;

    try {
      await updateUserOrganization(parsedUserOrganizationId);
      await queryClient.refetchQueries({ queryKey: userRoleQueryKey });
      redirectToHome();
    } catch (error) {
      console.error('Failed to update user organization', error);
    }
  };

  const handleDisplayNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHasUserEditedDisplayName(true);
    setDisplayName(event.currentTarget.value);
  };

  const handleDisplayNameSave = async () => {
    const trimmedDisplayName = displayName.trim();

    if (trimmedDisplayName.length === 0) {
      return;
    }

    try {
      await updateUserDisplayName(trimmedDisplayName);
      setHasUserEditedDisplayName(false);
      setDisplayName(trimmedDisplayName);
    } catch (error) {
      console.error('Failed to update display name', error);
    }
  };

  return (
    <Stack gap="xl" p="md" align="center">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label="Display name"
          placeholder="Enter a display name"
          value={displayName}
          onChange={handleDisplayNameChange}
          style={{ flex: 1, minWidth: 260 }}
          disabled={!isUserLoggedIn}
        />
        <Button
          onClick={handleDisplayNameSave}
          disabled={
            !isUserLoggedIn || !hasUserEditedDisplayName || displayName.trim().length === 0
          }
          loading={isUpdatingDisplayName}
        >
          Save changes
        </Button>
      </Group>
      <Group gap="sm" align="flex-end" wrap="wrap">
        {isUserLoggedIn && (
          <>
            <Select
              label="Organization"
              placeholder="Select an organization"
              data={organizationOptions}
              value={selectedUserOrganizationId}
              onChange={handleOrganizationChange}
              nothingFoundMessage="No organizations available"
              disabled={isLoading || isError}
              error={isError ? 'Unable to load organizations. Please try again later.' : undefined}
              style={{ flex: 1, minWidth: 260 }}
              searchable
              allowDeselect
              />
            <Button component={Link} to="/organizations/apply">
              Apply to an Organization
            </Button>
          </>
        )}
      </Group>
      <ColorSchemeToggle />
    </Stack>
  );
}
