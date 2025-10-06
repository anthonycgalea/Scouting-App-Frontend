import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Center,
  Flex,
  Image,
  Loader,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import clsx from 'clsx';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconPhoto,
} from '@tabler/icons-react';
import { useParams } from '@tanstack/react-router';
import {
  useMatchPreview,
  useMatchSchedule,
  type MatchPreviewAllianceTeamStats,
  type MatchPreviewMetric,
} from '@/api';
import { TeamImage, useTeamImages } from '@/api/teams';
import classes from './MatchPreview.module.css';

type AutoTeleopPieceKey = Exclude<keyof MatchPreviewAllianceTeamStats['auto'], 'total_points'>;

const AUTO_TELEOP_FIELDS: Array<{ label: string; key: AutoTeleopPieceKey }> = [
  { label: 'L4', key: 'level4' },
  { label: 'L3', key: 'level3' },
  { label: 'L2', key: 'level2' },
  { label: 'L1', key: 'level1' },
  { label: 'Net', key: 'net' },
  { label: 'Processor', key: 'processor' },
];

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

  const previewParams = useMemo(() => {
    const derivedMatchLevel = (match?.match_level ?? matchLevel ?? '').toString();

    const scheduleMatchNumber =
      typeof match?.match_number === 'number' ? match.match_number : undefined;

    const derivedMatchNumber =
      scheduleMatchNumber !== undefined && Number.isFinite(scheduleMatchNumber)
        ? scheduleMatchNumber
        : numericMatchNumber;

    return {
      matchLevel: derivedMatchLevel,
      matchNumber: derivedMatchNumber,
    };
  }, [match?.match_level, match?.match_number, matchLevel, numericMatchNumber]);

  const {
    data: matchPreview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
  } = useMatchPreview(previewParams);

  if (isLoading || isPreviewLoading) {
    return (
      <Center mih={200}>
        <Loader />
      </Center>
    );
  }

  if (isError || isPreviewError) {
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

  if (!matchPreview) {
    return (
      <Center mih={200}>
        <Text fw={500}>Match preview data is unavailable.</Text>
      </Center>
    );
  }

  const { red: redAlliance, blue: blueAlliance } = matchPreview;

  const redTeamStatsMap = useMemo(
    () => new Map(redAlliance.teams.map((team) => [team.team_number, team])),
    [redAlliance.teams]
  );

  const blueTeamStatsMap = useMemo(
    () => new Map(blueAlliance.teams.map((team) => [team.team_number, team])),
    [blueAlliance.teams]
  );

  const matchLevelLabels: Record<string, string> = {
    qm: 'Qualification',
    sf: 'Playoff',
    f: 'Finals',
  };

  const normalizedLevel = match.match_level?.toLowerCase() ?? matchLevel.toLowerCase();
  const matchLevelLabel = matchLevelLabels[normalizedLevel] ?? match.match_level ?? matchLevel;
  const redTeamNumbers = [
    match.red1_id,
    match.red2_id,
    match.red3_id,
  ] as [number, number, number];
  const blueTeamNumbers = [
    match.blue1_id,
    match.blue2_id,
    match.blue3_id,
  ] as [number, number, number];
  const redAllianceImageQueries = redTeamNumbers.map((teamNumber) => useTeamImages(teamNumber));
  const blueAllianceImageQueries = blueTeamNumbers.map((teamNumber) => useTeamImages(teamNumber));

  const hasValidTeam = (teamNumber: number) => Number.isFinite(teamNumber) && teamNumber > 0;

  const getAllianceStatus = (
    teamNumbers: [number, number, number],
    queries: ReturnType<typeof useTeamImages>[]
  ) => {
    const hasTeams = teamNumbers.some((teamNumber) => hasValidTeam(teamNumber));
    const hasImagesOrLoading = teamNumbers.some((teamNumber, index) => {
      if (!hasValidTeam(teamNumber)) {
        return false;
      }

      const query = queries[index];

      if (query.isLoading) {
        return true;
      }

      return (query.data?.length ?? 0) > 0;
    });

    return { hasTeams, hasImagesOrLoading };
  };

  const redAllianceStatus = getAllianceStatus(redTeamNumbers, redAllianceImageQueries);
  const blueAllianceStatus = getAllianceStatus(blueTeamNumbers, blueAllianceImageQueries);

  const shouldShowImageRow =
    (redAllianceStatus.hasTeams && redAllianceStatus.hasImagesOrLoading) ||
    (blueAllianceStatus.hasTeams && blueAllianceStatus.hasImagesOrLoading);

  const redAutonomousTotal = computeAllianceMetricSum(
    redTeamNumbers,
    redTeamStatsMap,
    (team) => team.auto.total_points
  );
  const blueAutonomousTotal = computeAllianceMetricSum(
    blueTeamNumbers,
    blueTeamStatsMap,
    (team) => team.auto.total_points
  );

  const redTeleopTotal = computeAllianceMetricSum(
    redTeamNumbers,
    redTeamStatsMap,
    (team) => team.teleop.total_points
  );
  const blueTeleopTotal = computeAllianceMetricSum(
    blueTeamNumbers,
    blueTeamStatsMap,
    (team) => team.teleop.total_points
  );

  const redEndgameTotal = computeAllianceMetricSum(
    redTeamNumbers,
    redTeamStatsMap,
    (team) => team.endgame
  );
  const blueEndgameTotal = computeAllianceMetricSum(
    blueTeamNumbers,
    blueTeamStatsMap,
    (team) => team.endgame
  );

  const redTotalScore = computeAllianceMetricSum(
    redTeamNumbers,
    redTeamStatsMap,
    (team) => team.total_points
  );
  const blueTotalScore = computeAllianceMetricSum(
    blueTeamNumbers,
    blueTeamStatsMap,
    (team) => team.total_points
  );

  const [collapsedSections, setCollapsedSections] = useState({
    autonomous: true,
    teleop: true,
  });

  const handleToggleSection = (section: 'autonomous' | 'teleop') => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <Box p="md">
      <Stack gap="lg">
        <Title order={2} ta="center">
          {matchLevelLabel} Match {numericMatchNumber} Preview
        </Title>
        <Card withBorder radius="md" shadow="sm" padding="lg">
          <Table highlightOnHover withColumnBorders className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th
                  colSpan={4}
                  className={clsx(classes.redCell, classes.allianceHeader)}
                  ta="center"
                >
                  Red Alliance
                </Table.Th>
                <Table.Th className={classes.fieldHeader} ta="center">
                  Field
                </Table.Th>
                <Table.Th
                  colSpan={4}
                  className={clsx(classes.blueCell, classes.allianceHeader)}
                  ta="center"
                >
                  Blue Alliance
                </Table.Th>
              </Table.Tr>
              <Table.Tr>
                {redTeamNumbers.map((_, index) => (
                  <Table.Th
                    key={`red-station-${index}`}
                    className={clsx(classes.redCell, classes.stationHeader)}
                    ta="center"
                  >
                    Red {index + 1}
                  </Table.Th>
                ))}
                <Table.Th className={clsx(classes.redCell, classes.stationHeader)} ta="center">
                  &nbsp;
                </Table.Th>
                <Table.Th className={classes.fieldHeader} ta="center">
                  &nbsp;
                </Table.Th>
                <Table.Th className={clsx(classes.blueCell, classes.stationHeader)} ta="center">
                  &nbsp;
                </Table.Th>
                {blueTeamNumbers.map((_, index) => (
                  <Table.Th
                    key={`blue-station-${index}`}
                    className={clsx(classes.blueCell, classes.stationHeader)}
                    ta="center"
                  >
                    Blue {index + 1}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {shouldShowImageRow && (
                <Table.Tr>
                  {redTeamNumbers.map((teamNumber, index) => (
                    <Table.Td
                      key={`red-image-${index}`}
                      className={classes.redCell}
                      style={{ verticalAlign: 'top' }}
                    >
                      <Center>
                        <AllianceTeamImageDisplay
                          teamNumber={teamNumber}
                          imageQuery={redAllianceImageQueries[index]}
                        />
                      </Center>
                    </Table.Td>
                  ))}
                  <Table.Td className={classes.redCell} />
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      Robot Photo
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell} />
                  {blueTeamNumbers.map((teamNumber, index) => (
                    <Table.Td
                      key={`blue-image-${index}`}
                      className={classes.blueCell}
                      style={{ verticalAlign: 'top' }}
                    >
                      <Center>
                        <AllianceTeamImageDisplay
                          teamNumber={teamNumber}
                          imageQuery={blueAllianceImageQueries[index]}
                        />
                      </Center>
                    </Table.Td>
                  ))}
                </Table.Tr>
              )}
              <Table.Tr>
                {redTeamNumbers.map((teamNumber, index) => {
                  const isValidTeam = hasValidTeam(teamNumber);

                  return (
                    <Table.Td key={`red-team-${index}`} className={classes.redCell} ta="center">
                      <Text fw={500}>{isValidTeam ? teamNumber : 'TBD'}</Text>
                    </Table.Td>
                  );
                })}
                <Table.Td className={classes.redCell} ta="center">
                  <Text fw={500}>Alliance Avg</Text>
                </Table.Td>
                <Table.Td className={classes.fieldCell}>
                  <Text fw={500} ta="center">
                    Team Number
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell} ta="center">
                  <Text fw={500}>Alliance Avg</Text>
                </Table.Td>
                {blueTeamNumbers.map((teamNumber, index) => {
                  const isValidTeam = hasValidTeam(teamNumber);

                  return (
                    <Table.Td key={`blue-team-${index}`} className={classes.blueCell} ta="center">
                      <Text fw={500}>{isValidTeam ? teamNumber : 'TBD'}</Text>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
              <Table.Tr>
                <Table.Th colSpan={9} className={classes.sectionHeader}>
                  <UnstyledButton
                    className={classes.collapsibleButton}
                    onClick={() => handleToggleSection('autonomous')}
                    aria-expanded={!collapsedSections.autonomous}
                  >
                    <Flex align="center" gap="xs" justify="center">
                      <Text fw={700}>Autonomous</Text>
                      {collapsedSections.autonomous ? (
                        <IconChevronDown size={16} stroke={1.5} />
                      ) : (
                        <IconChevronUp size={16} stroke={1.5} />
                      )}
                    </Flex>
                  </UnstyledButton>
                </Table.Th>
              </Table.Tr>
              {!collapsedSections.autonomous && (
                <>
                  {AUTO_TELEOP_FIELDS.map(({ label, key }) => (
                    <Table.Tr key={`autonomous-${key}`}>
                      {redTeamNumbers.map((teamNumber, index) => {
                        const teamStats = redTeamStatsMap.get(teamNumber);

                        return (
                          <Table.Td
                            key={`autonomous-red-${index}-${key}`}
                            className={classes.redCell}
                          >
                            <MetricValueDisplay
                              value={metricFromMatchPreviewMetric(teamStats?.auto[key])}
                            />
                          </Table.Td>
                        );
                      })}
                      <Table.Td className={classes.redCell}>
                        <MetricValueDisplay
                          value={metricFromAverage(
                            redAlliance.alliance_level_averages.auto[key]
                          )}
                        />
                      </Table.Td>
                      <Table.Td className={classes.fieldCell}>
                        <Text fw={500} ta="center">
                          {label}
                        </Text>
                      </Table.Td>
                      <Table.Td className={classes.blueCell}>
                        <MetricValueDisplay
                          value={metricFromAverage(
                            blueAlliance.alliance_level_averages.auto[key]
                          )}
                        />
                      </Table.Td>
                      {blueTeamNumbers.map((teamNumber, index) => {
                        const teamStats = blueTeamStatsMap.get(teamNumber);

                        return (
                          <Table.Td
                            key={`autonomous-blue-${index}-${key}`}
                            className={classes.blueCell}
                          >
                            <MetricValueDisplay
                              value={metricFromMatchPreviewMetric(teamStats?.auto[key])}
                            />
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </>
              )}
              <Table.Tr className={classes.totalRow}>
                {redTeamNumbers.map((teamNumber, index) => {
                  const teamStats = redTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`autonomous-total-red-${index}`} className={classes.redCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.auto.total_points)}
                      />
                    </Table.Td>
                  );
                })}
                <Table.Td className={classes.redCell}>
                  <MetricValueDisplay value={redAutonomousTotal} />
                </Table.Td>
                <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
                  <Text fw={700} ta="center">
                    Autonomous Total
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell}>
                  <MetricValueDisplay value={blueAutonomousTotal} />
                </Table.Td>
                {blueTeamNumbers.map((teamNumber, index) => {
                  const teamStats = blueTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`autonomous-total-blue-${index}`} className={classes.blueCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.auto.total_points)}
                      />
                    </Table.Td>
                  );
                })}
              </Table.Tr>
              <Table.Tr>
                <Table.Th colSpan={9} className={classes.sectionHeader}>
                  <UnstyledButton
                    className={classes.collapsibleButton}
                    onClick={() => handleToggleSection('teleop')}
                    aria-expanded={!collapsedSections.teleop}
                  >
                    <Flex align="center" gap="xs" justify="center">
                      <Text fw={700}>Teleop</Text>
                      {collapsedSections.teleop ? (
                        <IconChevronDown size={16} stroke={1.5} />
                      ) : (
                        <IconChevronUp size={16} stroke={1.5} />
                      )}
                    </Flex>
                  </UnstyledButton>
                </Table.Th>
              </Table.Tr>
              {!collapsedSections.teleop && (
                <>
                  {AUTO_TELEOP_FIELDS.map(({ label, key }) => (
                    <Table.Tr key={`teleop-${key}`}>
                      {redTeamNumbers.map((teamNumber, index) => {
                        const teamStats = redTeamStatsMap.get(teamNumber);

                        return (
                          <Table.Td
                            key={`teleop-red-${index}-${key}`}
                            className={classes.redCell}
                          >
                            <MetricValueDisplay
                              value={metricFromMatchPreviewMetric(teamStats?.teleop[key])}
                            />
                          </Table.Td>
                        );
                      })}
                      <Table.Td className={classes.redCell}>
                        <MetricValueDisplay
                          value={metricFromAverage(
                            redAlliance.alliance_level_averages.teleop[key]
                          )}
                        />
                      </Table.Td>
                      <Table.Td className={classes.fieldCell}>
                        <Text fw={500} ta="center">
                          {label}
                        </Text>
                      </Table.Td>
                      <Table.Td className={classes.blueCell}>
                        <MetricValueDisplay
                          value={metricFromAverage(
                            blueAlliance.alliance_level_averages.teleop[key]
                          )}
                        />
                      </Table.Td>
                      {blueTeamNumbers.map((teamNumber, index) => {
                        const teamStats = blueTeamStatsMap.get(teamNumber);

                        return (
                          <Table.Td
                            key={`teleop-blue-${index}-${key}`}
                            className={classes.blueCell}
                          >
                            <MetricValueDisplay
                              value={metricFromMatchPreviewMetric(teamStats?.teleop[key])}
                            />
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </>
              )}
              <Table.Tr className={classes.totalRow}>
                {redTeamNumbers.map((teamNumber, index) => {
                  const teamStats = redTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`teleop-total-red-${index}`} className={classes.redCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.teleop.total_points)}
                      />
                    </Table.Td>
                  );
                })}
                <Table.Td className={classes.redCell}>
                  <MetricValueDisplay value={redTeleopTotal} />
                </Table.Td>
                <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
                  <Text fw={700} ta="center">
                    Teleop Total
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell}>
                  <MetricValueDisplay value={blueTeleopTotal} />
                </Table.Td>
                {blueTeamNumbers.map((teamNumber, index) => {
                  const teamStats = blueTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`teleop-total-blue-${index}`} className={classes.blueCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.teleop.total_points)}
                      />
                    </Table.Td>
                  );
                })}
              </Table.Tr>
              <Table.Tr>
                <Table.Th colSpan={9} className={classes.sectionHeader}>
                  Endgame
                </Table.Th>
              </Table.Tr>
              <Table.Tr>
                {redTeamNumbers.map((teamNumber, index) => {
                  const teamStats = redTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`endgame-red-${index}`} className={classes.redCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.endgame)}
                      />
                    </Table.Td>
                  );
                })}
                <Table.Td className={classes.redCell}>
                  <MetricValueDisplay value={redEndgameTotal} />
                </Table.Td>
                <Table.Td className={classes.fieldCell}>
                  <Text fw={500} ta="center">
                    Endgame Points
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell}>
                  <MetricValueDisplay value={blueEndgameTotal} />
                </Table.Td>
                {blueTeamNumbers.map((teamNumber, index) => {
                  const teamStats = blueTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`endgame-blue-${index}`} className={classes.blueCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.endgame)}
                      />
                    </Table.Td>
                  );
                })}
              </Table.Tr>
              <Table.Tr className={classes.totalRow}>
                {redTeamNumbers.map((teamNumber, index) => {
                  const teamStats = redTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`total-score-red-${index}`} className={classes.redCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.total_points)}
                      />
                    </Table.Td>
                  );
                })}
                <Table.Td className={classes.redCell}>
                  <MetricValueDisplay value={redTotalScore} />
                </Table.Td>
                <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
                  <Text fw={700} ta="center">
                    Total Score
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell}>
                  <MetricValueDisplay value={blueTotalScore} />
                </Table.Td>
                {blueTeamNumbers.map((teamNumber, index) => {
                  const teamStats = blueTeamStatsMap.get(teamNumber);

                  return (
                    <Table.Td key={`total-score-blue-${index}`} className={classes.blueCell}>
                      <MetricValueDisplay
                        value={metricFromMatchPreviewMetric(teamStats?.total_points)}
                      />
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Box>
  );
}

type MetricValue = {
  average: number;
  standard_deviation?: number;
};

const MetricValueDisplay = ({ value }: { value?: MetricValue | null }) => {
  const averageText = formatMetricNumber(value?.average);

  if (averageText === null) {
    return (
      <Text fw={500} ta="center">
        —
      </Text>
    );
  }

  const deviationText = formatMetricNumber(value?.standard_deviation);

  return (
    <Stack gap={0} align="center" justify="center">
      <Text fw={600}>{averageText}</Text>
      {deviationText ? (
        <Text size="sm" c="dimmed">
          ± {deviationText}
        </Text>
      ) : null}
    </Stack>
  );
};

const formatMetricNumber = (value: number | null | undefined) => {
  if (!isValidNumber(value)) {
    return null;
  }

  return value.toFixed(1);
};

const isValidNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const metricFromMatchPreviewMetric = (metric?: MatchPreviewMetric) => {
  if (!metric || !isValidNumber(metric.average)) {
    return null;
  }

  return {
    average: metric.average,
    standard_deviation: isValidNumber(metric.standard_deviation)
      ? metric.standard_deviation
      : undefined,
  } satisfies MetricValue;
};

const metricFromAverage = (value: number | null | undefined) => {
  if (!isValidNumber(value)) {
    return null;
  }

  return { average: value } satisfies MetricValue;
};

const computeAllianceMetricSum = (
  teamNumbers: [number, number, number],
  teamMap: Map<number, MatchPreviewAllianceTeamStats>,
  accessor: (team: MatchPreviewAllianceTeamStats) => MatchPreviewMetric | undefined
) => {
  let sum = 0;
  let variance = 0;
  let hasAverage = false;
  let hasDeviation = false;

  teamNumbers.forEach((teamNumber) => {
    const team = teamMap.get(teamNumber);

    if (!team) {
      return;
    }

    const metric = accessor(team);

    if (!metric || !isValidNumber(metric.average)) {
      return;
    }

    sum += metric.average;
    hasAverage = true;

    if (isValidNumber(metric.standard_deviation)) {
      variance += metric.standard_deviation * metric.standard_deviation;
      hasDeviation = true;
    }
  });

  if (!hasAverage) {
    return null;
  }

  return {
    average: sum,
    standard_deviation: hasDeviation ? Math.sqrt(variance) : undefined,
  } satisfies MetricValue;
};

interface AllianceTeamImageDisplayProps {
  teamNumber: number;
  imageQuery: ReturnType<typeof useTeamImages>;
}

const AllianceTeamImageDisplay = ({ teamNumber, imageQuery }: AllianceTeamImageDisplayProps) => {
  const { data: images = [], isLoading, isError } = imageQuery;
  const hasValidTeam = Number.isFinite(teamNumber) && teamNumber > 0;

  if (!hasValidTeam) {
    return null;
  }

  if (isLoading) {
    return (
      <Stack align="center" w={180}>
        <Skeleton h={120} w="100%" radius="md" />
        <Skeleton h={14} w="60%" />
      </Stack>
    );
  }

  if (isError || images.length === 0) {
    return <MissingTeamImage teamNumber={teamNumber} />;
  }

  return <TeamImageCarousel teamNumber={teamNumber} images={images} />;
};

interface TeamImageCarouselProps {
  teamNumber: number;
  images: TeamImage[];
}

const TeamImageCarousel = ({ teamNumber, images }: TeamImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (!images.length) {
    return <MissingTeamImage teamNumber={teamNumber} />;
  }

  const showControls = images.length > 1;
  const currentImage = images[activeIndex];

  const handlePrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  return (
    <Stack gap="xs" align="center" w={180}>
      <Flex align="center" gap="xs" justify="center" w="100%">
        {showControls && (
          <ActionIcon aria-label={`Previous image for team ${teamNumber}`} variant="light" size="sm"
            onClick={handlePrevious}
          >
            <IconChevronLeft size={16} stroke={1.5} />
          </ActionIcon>
        )}
        <Box w={140} h={120} style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
          <Image
            src={currentImage.image_url}
            alt={currentImage.description || `Team ${teamNumber} image ${activeIndex + 1}`}
            fit="cover"
            height={120}
            width={140}
            radius="md"
            fallbackSrc=""
          />
        </Box>
        {showControls && (
          <ActionIcon aria-label={`Next image for team ${teamNumber}`} variant="light" size="sm"
            onClick={handleNext}
          >
            <IconChevronRight size={16} stroke={1.5} />
          </ActionIcon>
        )}
      </Flex>
      <Text size="sm" c="dimmed">
        {activeIndex + 1} / {images.length}
      </Text>
      <Text size="sm" fw={500}>
        Team {teamNumber}
      </Text>
    </Stack>
  );
};

interface MissingTeamImageProps {
  teamNumber: number;
}

const MissingTeamImage = ({ teamNumber }: MissingTeamImageProps) => (
  <Stack align="center" gap="xs" w={180}>
    <Stack
      align="center"
      justify="center"
      gap="xs"
      w="100%"
      h={120}
      style={{
        border: '1px dashed var(--mantine-color-gray-4)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <IconPhoto size={28} stroke={1.5} color="var(--mantine-color-gray-5)" />
      <Text size="sm" c="dimmed" ta="center">
        No images
      </Text>
    </Stack>
    <Text size="sm" fw={500}>
      Team {teamNumber}
    </Text>
  </Stack>
);
