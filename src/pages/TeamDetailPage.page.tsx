import { lazy, Suspense, useState } from 'react';
import { Alert, Box, Center, Loader, Skeleton, Stack } from '@mantine/core';
import {
  TeamPageSection,
  TeamPageToggle,
} from '@/components/TeamPageToggle/TeamPageToggle';
import { useParams } from '@tanstack/react-router';

const TeamMatchTable = lazy(async () => ({
  default: (await import('@/components/TeamMatchTable/TeamMatchTable')).TeamMatchTable,
}));

const TeamAnalytics = lazy(async () => ({
  default: (await import('@/components/TeamAnalytics/TeamAnalytics')).TeamAnalytics,
}));

const TeamPitScout = lazy(async () => ({
  default: (await import('@/components/TeamPitScout/TeamPitScout')).TeamPitScout,
}));

const TeamHeader = lazy(async () => ({
  default: (await import('@/components/TeamHeader/TeamHeader')).TeamHeader,
}));

export function TeamDetailPage() {
  const { teamId } = useParams({ from: '/teams/$teamId' });
  const teamNumber = Number.parseInt(teamId ?? '', 10);
  const [activeSection, setActiveSection] = useState<TeamPageSection>('match-data');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'analytics':
        return <TeamAnalytics />;
      case 'pit-scouting':
        return <TeamPitScout />;
      default:
        return <TeamMatchTable />;
    }
  };

  return (
    <Box p="md">
      <Stack gap="md">
        <Suspense fallback={<Skeleton height={34} width="50%" radius="sm" />}>
          {Number.isNaN(teamNumber) ? (
            <Alert color="red" title="Invalid team number" />
          ) : (
            <TeamHeader teamNumber={teamNumber} />
          )}
        </Suspense>
        <TeamPageToggle value={activeSection} onChange={(value) => setActiveSection(value)} />
        <Suspense
          fallback={
            <Center mih={200}>
              <Loader />
            </Center>
          }
        >
          {renderActiveSection()}
        </Suspense>
      </Stack>
    </Box>
  );
}
