import { Box, Stack, Text, Title } from '@mantine/core';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function PickListsPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <Stack gap="sm">
        <Title order={2}>Pick Lists</Title>
        <Text c="dimmed">
          Tools for managing pick lists will be added to this page soon.
        </Text>
      </Stack>
    </Box>
  );
}
