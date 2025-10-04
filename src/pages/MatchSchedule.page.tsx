import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Center,
  Group,
  Loader,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { syncEventMatches, useMatchSchedule } from '@/api';
import { groupMatchesBySection, SECTION_DEFINITIONS } from '@/components/MatchSchedule/matchSections';
import {
  MatchScheduleSection,
  MatchScheduleToggle,
} from '@/components/MatchSchedule/MatchScheduleToggle';

const MatchScheduleComponent = lazy(async () => ({
  default: (await import('@/components/MatchSchedule/MatchSchedule')).MatchSchedule,
}));

const EventHeader = lazy(async () => ({
  default: (await import('@/components/EventHeader/EventHeader')).EventHeader,
}));

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
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncMatches = async () => {
    try {
      setIsSyncing(true);
      await syncEventMatches();
      window.location.reload();
    } catch (error) {
      setIsSyncing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to sync event matches', error);
    }
  };

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

  const hasAvailableSections = availableSections.length > 0;
  const toggleOptions = availableSections.map(({ label, value }) => ({ label, value }));
  const activeMatches = activeSection
    ? matchesBySection[activeSection]
    : [];

  return (
    <Box p="md">
      <Stack gap="md">
        <Suspense
          fallback={
            <Group justify="center" align="center" gap="sm">
              <Skeleton height={34} width={200} radius="sm" />
              <Skeleton height={36} width={36} radius="md" />
            </Group>
          }
        >
          <Group justify="center" align="center" gap="sm">
            <EventHeader pageInfo="Match Schedule" />
            <ActionIcon
              aria-label="Sync match schedule"
              size="lg"
              radius="md"
              variant="default"
              style={{ backgroundColor: 'var(--mantine-color-body)' }}
              onClick={handleSyncMatches}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader size="sm" /> : <IconRefresh size={20} />}
            </ActionIcon>
          </Group>
        </Suspense>
        {hasAvailableSections && activeSection ? (
          <>
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
          </>
        ) : (
          <Center mih={200}>
            <Text fw={500}>No matches are available for this event.</Text>
          </Center>
        )}
      </Stack>
    </Box>
  );
}
