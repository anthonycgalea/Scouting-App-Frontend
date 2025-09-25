import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Box, Center, Loader, Skeleton, Stack, Text } from '@mantine/core';
import { useMatchSchedule } from '@/api';
import { groupMatchesBySection, SECTION_DEFINITIONS } from '@/components/MatchSchedule/matchSections';
import {
  MatchScheduleSection,
  MatchScheduleToggle,
} from '@/components/MatchSchedule/MatchScheduleToggle';
import { SuperScout } from '@/components/SuperScout/SuperScout';

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

export function SuperScoutPage() {
  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();
  const matchesBySection = useMemo(
    () => groupMatchesBySection(scheduleData),
    [scheduleData]
  );

  const availableSections = useMemo(
    () =>
      SECTION_DEFINITIONS.filter(
        (section) => matchesBySection[section.value].length > 0
      ),
    [matchesBySection]
  );

  const [activeSection, setActiveSection] = useState<MatchScheduleSection | undefined>();

  useEffect(() => {
    if (availableSections.length === 0) {
      setActiveSection(undefined);
      return;
    }

    setActiveSection((current) => {
      if (current && availableSections.some((section) => section.value === current)) {
        return current;
      }

      return availableSections[0]?.value;
    });
  }, [availableSections]);

  if (isLoading) {
    return (
      <Box p="md">
        <Center mih={200}>
          <Loader />
        </Center>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p="md">
        <Center mih={200}>
          <Text c="red.6" fw={500}>
            Unable to load the match schedule.
          </Text>
        </Center>
      </Box>
    );
  }

  if (!activeSection || availableSections.length === 0) {
    return (
      <Box p="md">
        <Center mih={200}>
          <Text fw={500}>No matches are available for this event.</Text>
        </Center>
      </Box>
    );
  }

  const toggleOptions = availableSections.map(({ label, value }) => ({ label, value }));
  const activeMatches = matchesBySection[activeSection];

  return (
    <Box p="md">
      <Stack gap="md">
        <Suspense fallback={<Skeleton height={34} width="50%" radius="sm" />}>
          <EventHeader pageInfo="Super Scout" />
        </Suspense>
        <MatchScheduleToggle
          value={activeSection}
          options={toggleOptions}
          onChange={(section) => setActiveSection(section)}
        />
        <SuperScout matches={activeMatches} />
      </Stack>
    </Box>
  );
}
