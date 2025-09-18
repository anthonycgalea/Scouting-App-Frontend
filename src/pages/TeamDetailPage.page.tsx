import { lazy, Suspense, useState } from 'react';
import { Box, Center, Loader, Stack } from '@mantine/core';
import {
  TeamPageSection,
  TeamPageToggle,
} from '@/components/TeamPageToggle/TeamPageToggle';

const TeamMatchTable = lazy(async () => ({
  default: (await import('@/components/TeamMatchTable/TeamMatchTable')).TeamMatchTable,
}));

const TeamAnalytics = lazy(async () => ({
  default: (await import('@/components/TeamAnalytics/TeamAnalytics')).TeamAnalytics,
}));

const TeamPitScout = lazy(async () => ({
  default: (await import('@/components/TeamPitScout/TeamPitScout')).TeamPitScout,
}));

export function TeamDetailPage() {
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
