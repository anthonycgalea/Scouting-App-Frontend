import { lazy, Suspense, useState } from 'react';
import { Alert, Box, Center, Loader, Skeleton, Stack } from '@mantine/core';
import {
  TeamPageSection,
  TeamPageToggle,
} from '@/components/TeamPageToggle/TeamPageToggle';
import { useParams } from '@tanstack/react-router';

const TeamMatchDetail = lazy(async () => ({
  default: (await import('@/components/TeamMatchDetail/TeamMatchDetail')).TeamMatchDetail,
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
        return <TeamAnalytics teamNumber={teamNumber} />;
      case 'pit-scouting':
        return <TeamPitScout teamNumber={teamNumber} />;
      default:
        return <TeamMatchDetail teamNumber={teamNumber} />;
    }
  };

  return (
    <Box p="md" h="100%">
      <Stack gap="md" h="100%">
        <Suspense fallback={<Skeleton height={34} width="50%" radius="sm" />}>
          {Number.isNaN(teamNumber) ? (
            <Alert color="red" title="Invalid team number" />
          ) : (
            <TeamHeader teamNumber={teamNumber} />
          )}
        </Suspense>
        <TeamPageToggle value={activeSection} onChange={(value) => setActiveSection(value)} />
        <Box style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Suspense
            fallback={
              <Center style={{ flex: 1, width: '100%' }}>
                <Loader />
              </Center>
            }
          >
            <Box h="100%" style={{ minHeight: 0, flex: 1 }}>
              {renderActiveSection()}
            </Box>
          </Suspense>
        </Box>
      </Stack>
    </Box>
  );
}
