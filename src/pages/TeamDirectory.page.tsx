import { lazy, Suspense } from 'react';
import { TeamDirectory } from '@/components/TeamDirectory/TeamDirectory';
import { Box, Skeleton, Stack } from '@mantine/core';
import { Outlet } from '@tanstack/react-router';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

export function TeamDirectoryPage() {
  return (
    <Box p="md">
      <Stack gap="md">
        <Suspense fallback={<Skeleton height={34} width="50%" radius="sm" />}>
          <EventHeader pageInfo="Competing Teams" />
        </Suspense>
        <TeamDirectory />
      </Stack>
      <Outlet />
    </Box>
  );
}
