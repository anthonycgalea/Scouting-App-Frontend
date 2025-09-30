import { Box, Stack, Text, Title } from '@mantine/core';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function AllianceSelectionPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Alliance Selection</Title>
        <Text c="dimmed">
          Alliance selection planning tools will be available on this page in a
          future release.
        </Text>
      </Stack>
    </Box>
  );
}
