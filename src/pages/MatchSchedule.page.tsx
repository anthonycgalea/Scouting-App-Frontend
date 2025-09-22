import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { useMatchSchedule } from '@/api';
import type { MatchScheduleEntry } from '@/api';
import {
  MatchScheduleSection,
  MatchScheduleToggle,
} from '@/components/MatchSchedule/MatchScheduleToggle';

const MatchScheduleComponent = lazy(async () => ({
  default: (await import('@/components/MatchSchedule/MatchSchedule')).MatchSchedule,
}));

const SECTION_DEFINITIONS: ReadonlyArray<{ value: MatchScheduleSection; label: string }> = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'playoffs', label: 'Playoffs' },
  { value: 'finals', label: 'Finals' },
];

const groupMatchesBySection = (matches: MatchScheduleEntry[]) => {
  const grouped: Record<MatchScheduleSection, MatchScheduleEntry[]> = {
    qualification: [],
    playoffs: [],
    finals: [],
  };

  matches.forEach((match) => {
    const matchLevel = match.match_level?.toLowerCase();

    if (matchLevel === 'qm') {
      grouped.qualification.push(match);
    } else if (matchLevel === 'sf') {
      grouped.playoffs.push(match);
    } else if (matchLevel === 'f') {
      grouped.finals.push(match);
    }
  });

  return grouped;
};

export function MatchSchedulePage() {
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
        <MatchScheduleToggle
          value={activeSection}
          options={toggleOptions}
          onChange={(section) => setActiveSection(section)}
        />
        <Suspense
          fallback={
            <Center mih={200}>
              <Loader />
            </Center>
          }
        >
          <MatchScheduleComponent matches={activeMatches} />
        </Suspense>
      </Stack>
    </Box>
  );
}
