import { Box, Paper, Stack, Text, Title } from '@mantine/core';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function PhotoManagerPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Paper withBorder p="xl" radius="md">
        <Stack gap="sm" align="flex-start">
          <Title order={2}>Photo Manager</Title>
          <Text c="dimmed">
            Photo Manager tools are coming soon. Check back later for photo upload and
            management features.
          </Text>
        </Stack>
      </Paper>
    </Box>
  );
}
