import { Box } from '@mantine/core';
import { EventSelect } from '@/components/EventSelect/EventSelect';
import { useRequireOrganizationAccess } from '@/hooks/useRequireOrganizationAccess';

export function OrganizationEventSelectPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <EventSelect />
    </Box>
  );
}