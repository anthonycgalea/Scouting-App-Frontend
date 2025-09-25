import { IconChevronRight } from '@tabler/icons-react';
import { Group, Text, UnstyledButton } from '@mantine/core';
import { useUserOrganization } from '@/api';
import { useAuth } from '../../auth/AuthProvider';
import classes from './UserButton.module.css';

export function UserButton() {
  const { user, loading } = useAuth();
  const {
    data: userOrganization,
    isLoading: isOrganizationLoading,
  } = useUserOrganization({ enabled: !!user });
  const displayName = user?.displayName ?? (loading ? 'Loading user…' : 'Guest');
  const organizationName = userOrganization?.organization_name;
  const description = user
    ? isOrganizationLoading
      ? 'Loading organization…'
      : organizationName ?? user.email ?? 'No organization selected'
    : loading
      ? 'Checking session status'
      : 'Connect with Discord to access your account';

  return (
    <UnstyledButton className={classes.user}>
      <Group wrap="nowrap" justify="space-between" gap="sm">
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {displayName}
          </Text>

          <Text c="dimmed" size="xs">
            {description}
          </Text>
        </div>

        {user ? <IconChevronRight size={14} stroke={1.5} /> : null}
      </Group>
    </UnstyledButton>
  );
}