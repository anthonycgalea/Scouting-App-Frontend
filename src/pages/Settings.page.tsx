import { useEffect, useMemo, useState } from 'react';
import { Button, Group, Select, Stack } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useOrganizations, useUpdateUserOrganization, useUserInfo } from '../api';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function UserSettingsPage() {
  const { data: organizations, isLoading, isError } = useOrganizations();
  const { data: userInfo } = useUserInfo();
  const { mutate: updateUserOrganization } = useUpdateUserOrganization();
  const isUserLoggedIn = userInfo?.id !== undefined && userInfo?.id !== null;
  const [selectedUserOrganizationId, setSelectedUserOrganizationId] = useState<string | null>(null);
  const [hasUserSelectedOrganization, setHasUserSelectedOrganization] = useState(false);

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

  const handleOrganizationChange = (value: string | null) => {
    setHasUserSelectedOrganization(true);
    setSelectedUserOrganizationId(value);
    const userOrganizationId = value ? Number.parseInt(value, 10) : null;

    if (userOrganizationId === null) {
      updateUserOrganization(null);
      return;
    }

    if (Number.isNaN(userOrganizationId)) {
      updateUserOrganization(null);
      return;
    }

    updateUserOrganization(userOrganizationId);
  };

  return (
    <Stack gap="xl" p="md" align="center">
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
