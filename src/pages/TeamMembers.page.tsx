import { TeamMembersTable } from "@/components/TeamMembersTable/TeamMembersTable";
import { Box } from "@mantine/core";
import { useRequireOrganizationAccess } from "@/hooks/useRequireOrganizationAccess";

export function TeamMembersPage() {
  const { canAccessOrganizationPages, isCheckingAccess } = useRequireOrganizationAccess();

  if (isCheckingAccess || !canAccessOrganizationPages) {
    return null;
  }

  return (
    <Box p="md">
      <TeamMembersTable />
    </Box>
  );
}
