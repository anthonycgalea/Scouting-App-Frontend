import { useEffect, useMemo, useState } from 'react';
import { Button, Group, Select, Stack } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useOrganizations, useUserInfo } from '../api';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function UserSettingsPage() {
  const { data: organizations, isLoading, isError } = useOrganizations();
  const { data: userInfo } = useUserInfo();
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
    if (!organizations || organizations.length === 0) {
      return null;
    }

    const resolvedUserOrganizationId =
      userInfo?.userOrgId ??
      userInfo?.user_org_id ??
      userInfo?.user_org?.user_organization_id ??
      null;

    if (resolvedUserOrganizationId !== null && resolvedUserOrganizationId !== undefined) {
      const matchingOrganization = organizations.find(
        (organization) => organization.user_organization_id === resolvedUserOrganizationId
      );

      if (matchingOrganization) {
        return matchingOrganization.user_organization_id.toString();
      }
    }

    const dataViewerOrganization = organizations.find((organization) => {
      const normalizedRole = organization.role.trim().toLowerCase();
      const normalizedName = organization.name.trim().toLowerCase();

      return normalizedRole === 'data viewer' || normalizedName === 'data viewer';
    });

    return dataViewerOrganization ? dataViewerOrganization.user_organization_id.toString() : null;
  }, [organizations, userInfo]);

  useEffect(() => {
    if (hasUserSelectedOrganization) {
      return;
    }

    setSelectedUserOrganizationId(defaultUserOrganizationId);
  }, [defaultUserOrganizationId, hasUserSelectedOrganization]);

  const handleOrganizationChange = (value: string | null) => {
    setHasUserSelectedOrganization(true);
    setSelectedUserOrganizationId(value);
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
