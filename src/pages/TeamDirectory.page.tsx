import { TeamDirectory } from '@/components/TeamDirectory/TeamDirectory';
import { Box } from '@mantine/core';
import { Outlet } from '@tanstack/react-router';

export function TeamDirectoryPage() {
  return (
    <Box p="md">
      <TeamDirectory />
      <Outlet />
    </Box>
  );
}
