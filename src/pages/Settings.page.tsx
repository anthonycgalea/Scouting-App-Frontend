import { useEffect, useMemo, useState } from 'react';
import { Button, Group, Select, Stack } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useOrganizations, useUserInfo } from '../api';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function UserSettingsPage() {
  const { data: organizations, isLoading, isError } = useOrganizations();
  const { data: userInfo } = useUserInfo();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [hasUserSelectedOrganization, setHasUserSelectedOrganization] = useState(false);

  const organizationOptions = useMemo(
    () =>
      (organizations ?? []).map((organization) => ({
        value: organization.user_organization_id.toString(),
        label: `${organization.name} (Team ${organization.team_number})`,
      })),
    [organizations]
  );

  const defaultOrganizationId = useMemo(() => {
    if (!organizations || organizations.length === 0) {
      return null;
    }

    const userOrgId = userInfo?.userOrgId ?? userInfo?.user_org_id;

    if (userOrgId === null || userOrgId === undefined) {
      return null;
    }

    const matchingOrganization = organizations.find(
      (organization) => organization.user_organization_id === userOrgId
    );

    return matchingOrganization ? matchingOrganization.user_organization_id.toString() : null;
  }, [organizations, userInfo]);

  useEffect(() => {
    if (hasUserSelectedOrganization) {
      return;
    }

    setSelectedOrganizationId(defaultOrganizationId);
  }, [defaultOrganizationId, hasUserSelectedOrganization]);

  const handleOrganizationChange = (value: string | null) => {
    setHasUserSelectedOrganization(true);
    setSelectedOrganizationId(value);
  };

  return (
    <Stack gap="xl" p="md" align="center">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <Select
          label="Organization"
          placeholder="Select an organization"
          data={organizationOptions}
          value={selectedOrganizationId}
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
      </Group>
      <ColorSchemeToggle />
    </Stack>
  );
}
