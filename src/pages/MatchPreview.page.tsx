import { useMemo } from 'react';
import { Box, Card, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';
import { MatchPreview2025 } from '@/components/MatchPreview/MatchPreview2025';

export function MatchPreviewPage() {
  const { matchLevel, matchNumber } = useParams({
    from: '/matches/preview/$matchLevel/$matchNumber',
  });
  const numericMatchNumber = Number.parseInt(matchNumber ?? '', 10);
  const { data: scheduleData = [], isLoading, isError } = useMatchSchedule();

  const match = useMemo(() => {
    if (!matchLevel || Number.isNaN(numericMatchNumber)) {
      return undefined;
    }

    const normalizedLevel = matchLevel.toLowerCase();

    return scheduleData.find(
      (entry) =>
        entry.match_level?.toLowerCase() === normalizedLevel &&
        entry.match_number === numericMatchNumber
    );
  }, [matchLevel, numericMatchNumber, scheduleData]);

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center mih={200}>
        <Text c="red.6" fw={500}>
          Unable to load the match preview.
        </Text>
      </Center>
    );
  }

  if (!matchLevel || Number.isNaN(numericMatchNumber)) {
    return (
      <Center mih={200}>
        <Text fw={500}>Invalid match information provided.</Text>
      </Center>
    );
  }

  if (!match) {
    return (
      <Center mih={200}>
        <Text fw={500}>Match not found.</Text>
      </Center>
    );
  }

  const matchLevelLabels: Record<string, string> = {
    qm: 'Qualification',
    sf: 'Playoff',
    f: 'Finals',
  };

  const normalizedLevel = match.match_level?.toLowerCase() ?? matchLevel.toLowerCase();
  const matchLevelLabel = matchLevelLabels[normalizedLevel] ?? match.match_level ?? matchLevel;
  const season = match.season;
  const shouldUse2025Preview = season === 1;

  return (
    <Box p="md">
      <Stack gap="lg">
        <Title order={2} ta="center">
          {matchLevelLabel} Match {numericMatchNumber} Preview
        </Title>
        {shouldUse2025Preview ? (
          <MatchPreview2025 match={match} />
        ) : (
          <Card withBorder radius="md" shadow="sm" padding="lg">
            <Text fw={500} ta="center">
              {season != null
                ? `Match preview is not yet available for season ${season}.`
                : 'Match preview is not available for this match.'}
            </Text>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
