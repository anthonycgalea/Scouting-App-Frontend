import { useMemo } from 'react';
import { Box, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';

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

  return (
    <Box p="md">
      <Stack gap="md">
        <Title order={2}>Match Preview</Title>
        <Text>Match Level: {matchLevel.toUpperCase()}</Text>
        <Text>Match Number: {numericMatchNumber}</Text>
        <Text>
          Red Alliance: {match.red1_id}, {match.red2_id}, {match.red3_id}
        </Text>
        <Text>
          Blue Alliance: {match.blue1_id}, {match.blue2_id}, {match.blue3_id}
        </Text>
      </Stack>
    </Box>
  );
}
