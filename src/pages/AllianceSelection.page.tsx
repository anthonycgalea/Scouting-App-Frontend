import { useState } from 'react';
import { ActionIcon, Box, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';
import { syncEventRankings } from '@/api';

export function AllianceSelectionPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshRankings = async () => {
    try {
      setIsRefreshing(true);
      await syncEventRankings();
      window.location.reload();
    } catch (error) {
      setIsRefreshing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to refresh event rankings', error);
    }
  };

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Stack gap="sm">
        <Group justify="center" align="center" gap="sm">
          <Title order={2}>Alliance Selection</Title>
          <ActionIcon
            aria-label="Refresh event rankings"
            size="lg"
            radius="md"
            variant="default"
            style={{ backgroundColor: 'var(--mantine-color-body)' }}
            onClick={handleRefreshRankings}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader size="sm" /> : <IconRefresh size={20} />}
          </ActionIcon>
        </Group>
        <Text c="dimmed">
          Alliance selection planning tools will be available on this page in a
          future release.
        </Text>
      </Stack>
    </Box>
  );
}
