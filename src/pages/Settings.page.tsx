import { useMemo, useState } from 'react';
import { Select, Stack } from '@mantine/core';
import { useOrganizations } from '../api';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function UserSettingsPage() {
  const { data: organizations, isLoading, isError } = useOrganizations();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  const organizationOptions = useMemo(
    () =>
      (organizations ?? []).map((organization) => ({
        value: organization.id.toString(),
        label: `${organization.name} (Team ${organization.team_number})`,
      })),
    [organizations]
  );

  return (
    <Stack gap="xl" p="md" align="center">
      <Select
        label="Organization"
        placeholder="Select an organization"
        data={organizationOptions}
        value={selectedOrganizationId}
        onChange={setSelectedOrganizationId}
        nothingFoundMessage="No organizations available"
        disabled={isLoading || isError}
        error={isError ? 'Unable to load organizations. Please try again later.' : undefined}
        w={340}
        searchable
        allowDeselect
      />
      <ColorSchemeToggle />
    </Stack>
  );
}
