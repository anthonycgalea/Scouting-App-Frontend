import { type ReactNode, useMemo } from 'react';
import { ActionIcon, Box, Card, Center, Flex, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useParams } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  matchSimulationQueryKey,
  runMatchSimulation,
  useMatchPreview,
  useMatchSchedule,
  useMatchSimulation,
  type MatchPreviewResponse,
  type MatchPreviewResponse2025,
  type MatchPreviewResponse2026,
  type MatchSimulationResponse,
} from '@/api';
import { MatchPreview2025 } from '@/components/MatchPreview/MatchPreview2025';
import { MatchPreview2026 } from '@/components/MatchPreview/MatchPreview2026';
import { Simulation, type MatchSimulationData } from '@/components/Simulation';
import classes from './MatchPreview.module.css';

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
  const previewParams = match
    ? {
        matchLevel: normalizedLevel,
        matchNumber: match.match_number ?? numericMatchNumber,
      }
    : undefined;
  const {
    data: matchPreview,
    isLoading: isMatchPreviewLoading,
    isError: isMatchPreviewError,
  } = useMatchPreview(previewParams);
  const simulationQueryKey = previewParams ? matchSimulationQueryKey(previewParams) : undefined;
  const {
    data: simulationResult,
    isLoading: isSimulationLoading,
    isError: isSimulationError,
    isFetching: isSimulationFetching,
  } = useMatchSimulation(previewParams);
  const queryClient = useQueryClient();
  const { mutate: triggerSimulation, isPending: isSimulationRunning } = useMutation({
    mutationFn: runMatchSimulation,
    onSuccess: async () => {
      if (simulationQueryKey) {
        await queryClient.invalidateQueries({ queryKey: simulationQueryKey });
      }
    },
  });

  const handleSimulationRefresh = () => {
    if (!previewParams || isSimulationRunning) {
      return;
    }

    triggerSimulation(previewParams);
  };

  if (isMatchPreviewLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isMatchPreviewError) {
    return (
      <Center mih={200}>
        <Text c="red.6" fw={500}>
          Unable to load the match preview.
        </Text>
      </Center>
    );
  }

  if (!matchPreview) {
    return (
      <Center mih={200}>
        <Text fw={500}>Match preview is not available for this match.</Text>
      </Center>
    );
  }

  const isMatchPreview2025 = (value: MatchPreviewResponse): value is MatchPreviewResponse2025 =>
    value.season === 1;
  const isMatchPreview2026 = (value: MatchPreviewResponse): value is MatchPreviewResponse2026 =>
    value.season === 2;
  const season = matchPreview.season;
  const shouldUse2025Preview = isMatchPreview2025(matchPreview);
  const shouldUse2026Preview = isMatchPreview2026(matchPreview);

  const isSimulationBusy = isSimulationLoading || isSimulationRunning || isSimulationFetching;
  const isMatchSimulationData = (
    value: MatchSimulationResponse | null | undefined
  ): value is MatchSimulationData =>
    typeof value === 'object' &&
    value !== null &&
    'season' in value &&
    typeof (value as { season?: unknown }).season === 'number';
  const simulationData = isMatchSimulationData(simulationResult)
    ? simulationResult
    : undefined;
  const simulationSamplesText = simulationData
    ? `${simulationData.n_samples.toLocaleString()} simulations`
    : undefined;
  let simulationContent: ReactNode;

  if (isSimulationLoading && !simulationResult) {
    simulationContent = (
      <Center mih={80}>
        <Loader size="sm" />
      </Center>
    );
  } else if (isSimulationError) {
    simulationContent = (
      <Text c="red.6" fw={500}>
        Unable to load the match simulation.
      </Text>
    );
  } else if (simulationResult == null || (typeof simulationResult === 'string' && simulationResult.length === 0)) {
    simulationContent = <Text c="dimmed">Simulation results will appear here.</Text>;
  } else if (typeof simulationResult === 'string') {
    simulationContent = (
      <Text
        component="pre"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        c="dimmed"
      >
        {simulationResult}
      </Text>
    );
  } else if (simulationData) {
    simulationContent = <Simulation simulation={simulationData} season={season} />;
  } else {
    simulationContent = (
      <Text c="dimmed">Simulation details are not available for this season yet.</Text>
    );
  }

  const previewCard = shouldUse2025Preview ? (
    <MatchPreview2025 match={match} preview={matchPreview} />
  ) : shouldUse2026Preview ? (
    <MatchPreview2026 match={match} preview={matchPreview} />
  ) : (
    <Card
      withBorder
      radius="md"
      shadow="sm"
      padding="lg"
      className={classes.cardRoot}
    >
      <Box className={classes.cardContent}>
        <Center h="100%">
          <Text fw={500} ta="center">
            {season != null
              ? `Match preview is not yet available for season ${season}.`
              : 'Match preview is not available for this match.'}
          </Text>
        </Center>
      </Box>
    </Card>
  );

  return (
    <Box p="md" className={classes.pageWrapper}>
      <Stack gap="lg" className={classes.pageStack}>
        <Title order={2} ta="center">
          {matchLevelLabel} Match {numericMatchNumber} Preview
        </Title>
        <Flex
          gap="lg"
          align="stretch"
          direction={{ base: 'column', lg: 'row' }}
          className={classes.contentFlex}
          style={{ minHeight: 0 }}
        >
          <Box
            className={`${classes.cardColumn} ${classes.previewColumn}`}
            style={{ minHeight: 0 }}
          >
            {previewCard}
          </Box>
          <Box
            className={`${classes.cardColumn} ${classes.predictionColumn}`}
            style={{ minHeight: 0 }}
          >
            <Card
              withBorder
              radius="md"
              shadow="sm"
              padding="lg"
              className={classes.cardRoot}
            >
              <Box className={classes.cardContent}>
                <Stack gap="sm">
                  <Stack gap={4}>
                    <Group justify="space-between" align="center">
                      <Title order={4}>Simulation</Title>
                      <ActionIcon
                        aria-label="Refresh match simulation"
                        size="lg"
                        radius="md"
                        variant="default"
                        style={{ backgroundColor: 'var(--mantine-color-body)' }}
                        onClick={handleSimulationRefresh}
                        disabled={!previewParams || isSimulationBusy}
                      >
                        {isSimulationBusy ? <Loader size="sm" /> : <IconRefresh size={20} />}
                      </ActionIcon>
                    </Group>
                    {simulationSamplesText ? (
                      <Text fz="xs" c="dimmed">
                        {simulationSamplesText}
                      </Text>
                    ) : null}
                  </Stack>
                  {simulationContent}
                </Stack>
              </Box>
            </Card>
          </Box>
        </Flex>
      </Stack>
    </Box>
  );
}
