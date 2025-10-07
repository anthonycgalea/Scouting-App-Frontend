import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Center,
  Flex,
  Image,
  Modal,
  Skeleton,
  Stack,
  Table,
  Text,
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
import type {
  MatchPreviewResponse,
  MatchScheduleEntry,
  MetricStatistics,
  TeamMatchPreview,
} from '@/api';
import { TeamImage, useTeamImages } from '@/api/teams';
import classes from '@/pages/MatchPreview.module.css';

type TeamImageQueryResult = ReturnType<typeof useTeamImages>;
type AllianceImageQueries = readonly [
  TeamImageQueryResult,
  TeamImageQueryResult,
  TeamImageQueryResult,
];

const useAllianceTeamImages = (
  teamNumbers: [number, number, number]
): AllianceImageQueries => {
  const first = useTeamImages(teamNumbers[0]);
  const second = useTeamImages(teamNumbers[1]);
  const third = useTeamImages(teamNumbers[2]);

  return [first, second, third];
};

interface MatchPreview2025Props {
  match: MatchScheduleEntry;
  preview: MatchPreviewResponse;
  className?: string;
  contentClassName?: string;
}

type AllianceTeam = TeamMatchPreview | undefined;

const resolveTeamNumbers = (
  teams: AllianceTeam[],
  fallbacks: [number, number, number]
): [number, number, number] => {
  const result = fallbacks.map((fallback, index) => {
    const teamNumber = teams[index]?.team_number;

    if (Number.isFinite(teamNumber) && teamNumber !== undefined && teamNumber > 0) {
      return teamNumber;
    }

    return fallback;
  });

  return [result[0] ?? 0, result[1] ?? 0, result[2] ?? 0] as [number, number, number];
};

const formatNumber = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.abs(value) < 0.05 ? 0 : value;

  return normalized.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const renderMetricCell = (stat?: MetricStatistics) => {
  const averageText = formatNumber(stat?.average);

  if (!averageText) {
    return <Text>—</Text>;
  }

  const deviationText = formatNumber(stat?.standard_deviation);

  return (
    <Stack gap={0} align="center" mih={48} justify="center">
      <Text fw={600}>{averageText}</Text>
      {deviationText && deviationText !== '0.0' ? (
        <Text fz="xs" c="dimmed">
          ±{deviationText}
        </Text>
      ) : null}
    </Stack>
  );
};

const renderPredictedCell = (value: number | null | undefined) => {
  const formatted = formatNumber(value);

  return (
    <Stack gap={0} align="center" mih={48} justify="center">
      <Text fw={600}>{formatted ?? '—'}</Text>
    </Stack>
  );
};

const sumTeamAverages = (
  teams: AllianceTeam[],
  selector: (team: AllianceTeam) => MetricStatistics | undefined
) => {
  let total = 0;
  let hasValue = false;

  teams.forEach((team) => {
    const stat = selector(team);
    const average = stat?.average;

    if (average != null && Number.isFinite(average)) {
      total += average;
      hasValue = true;
    }
  });

  return hasValue ? total : undefined;
};

interface FieldConfig {
  key: string;
  label: string;
  getTeamStat: (team: AllianceTeam) => MetricStatistics | undefined;
}

export const MatchPreview2025 = ({
  match,
  preview,
  className,
  contentClassName,
}: MatchPreview2025Props) => {
  const redTeams: AllianceTeam[] = [
    preview.red.teams[0],
    preview.red.teams[1],
    preview.red.teams[2],
  ];
  const blueTeams: AllianceTeam[] = [
    preview.blue.teams[0],
    preview.blue.teams[1],
    preview.blue.teams[2],
  ];
  const redTeamNumbers = resolveTeamNumbers(redTeams, [
    match.red1_id,
    match.red2_id,
    match.red3_id,
  ]);
  const blueTeamNumbers = resolveTeamNumbers(blueTeams, [
    match.blue1_id,
    match.blue2_id,
    match.blue3_id,
  ]);
  const redAllianceImageQueries = useAllianceTeamImages(redTeamNumbers);
  const blueAllianceImageQueries = useAllianceTeamImages(blueTeamNumbers);

  const hasValidTeam = (teamNumber: number) => Number.isFinite(teamNumber) && teamNumber > 0;

  const autonomousFields: FieldConfig[] = [
    { key: 'auto-level4', label: 'L4', getTeamStat: (team) => team?.auto.level4 },
    { key: 'auto-level3', label: 'L3', getTeamStat: (team) => team?.auto.level3 },
    { key: 'auto-level2', label: 'L2', getTeamStat: (team) => team?.auto.level2 },
    { key: 'auto-level1', label: 'L1', getTeamStat: (team) => team?.auto.level1 },
    { key: 'auto-net', label: 'Net', getTeamStat: (team) => team?.auto.net },
    { key: 'auto-processor', label: 'Processor', getTeamStat: (team) => team?.auto.processor },
  ];
  const teleopFields: FieldConfig[] = [
    { key: 'teleop-level4', label: 'L4', getTeamStat: (team) => team?.teleop.level4 },
    { key: 'teleop-level3', label: 'L3', getTeamStat: (team) => team?.teleop.level3 },
    { key: 'teleop-level2', label: 'L2', getTeamStat: (team) => team?.teleop.level2 },
    { key: 'teleop-level1', label: 'L1', getTeamStat: (team) => team?.teleop.level1 },
    { key: 'teleop-net', label: 'Net', getTeamStat: (team) => team?.teleop.net },
    { key: 'teleop-processor', label: 'Processor', getTeamStat: (team) => team?.teleop.processor },
  ];
  const endgameFields: FieldConfig[] = [
    { key: 'endgame-points', label: 'Endgame Points', getTeamStat: (team) => team?.endgame },
  ];
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
    <Card
      withBorder
      radius="md"
      shadow="sm"
      padding="lg"
      className={clsx(classes.cardRoot, className)}
    >
      <Box className={clsx(classes.cardContent, contentClassName)}>
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
            <Table.Th />
              
            <Table.Th
              colSpan={4}
              className={clsx(classes.blueCell, classes.allianceHeader)}
              ta="center"
            >
              Blue Alliance
            </Table.Th>
          </Table.Tr>
          <Table.Tr>
            {redTeamNumbers.map((teamNumber, index) => {
              const isValidTeam = hasValidTeam(teamNumber);

              return (
                <Table.Th
                  key={`red-station-${index}`}
                  className={clsx(classes.redCell, classes.stationHeader)}
                  ta="center"
                >
                  <Stack gap={2} align="center">
                    <Text fw={700} fz="md">
                      {isValidTeam ? teamNumber : 'TBD'}
                    </Text>
                  </Stack>
                </Table.Th>
              );
            })}
            <Table.Th className={clsx(classes.redCell, classes.stationHeader)} ta="center">
              <Text fw={500}>Predicted</Text>
            </Table.Th>
            <Table.Th className={classes.fieldHeader} ta="center">
              &nbsp;
            </Table.Th>
            <Table.Th className={clsx(classes.blueCell, classes.stationHeader)} ta="center">
              <Text fw={500}>Predicted</Text>
            </Table.Th>
            {blueTeamNumbers.map((teamNumber, index) => {
              const isValidTeam = hasValidTeam(teamNumber);

              return (
                <Table.Th
                  key={`blue-station-${index}`}
                  className={clsx(classes.blueCell, classes.stationHeader)}
                  ta="center"
                >
                  <Stack gap={2} align="center">
                    <Text fw={700} fz="md">
                      {isValidTeam ? teamNumber : 'TBD'}
                    </Text>
                  </Stack>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            {redTeamNumbers.map((teamNumber, index) => (
              <Table.Td
                key={`red-image-${index}`}
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
            <Table.Td className={classes.fieldCell} />
            <Table.Td className={classes.blueCell} />
            {blueTeamNumbers.map((teamNumber, index) => (
              <Table.Td
                key={`blue-image-${index}`}
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
              {autonomousFields.map((field) => (
                <Table.Tr key={`autonomous-${field.key}`}>
                  {redTeams.map((team, index) => (
                    <Table.Td key={`autonomous-red-${index}-${field.key}`}>
                      {renderMetricCell(field.getTeamStat(team))}
                    </Table.Td>
                  ))}
                  <Table.Td className={classes.redCell}>
                    {renderPredictedCell(sumTeamAverages(redTeams, field.getTeamStat))}
                  </Table.Td>
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      {field.label}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell}>
                    {renderPredictedCell(sumTeamAverages(blueTeams, field.getTeamStat))}
                  </Table.Td>
                  {blueTeams.map((team, index) => (
                    <Table.Td key={`autonomous-blue-${index}-${field.key}`}>
                      {renderMetricCell(field.getTeamStat(team))}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </>
          )}
          <Table.Tr className={classes.totalRow}>
            {redTeams.map((team, index) => (
              <Table.Td key={`autonomous-total-red-${index}`}>
                {renderMetricCell(team?.auto.total_points)}
              </Table.Td>
            ))}
            <Table.Td className={classes.redCell}>
              {renderPredictedCell(
                sumTeamAverages(redTeams, (team) => team?.auto.total_points)
              )}
            </Table.Td>
            <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
              <Text fw={700} ta="center">
                Auto Total
              </Text>
            </Table.Td>
            <Table.Td className={classes.blueCell}>
              {renderPredictedCell(
                sumTeamAverages(blueTeams, (team) => team?.auto.total_points)
              )}
            </Table.Td>
            {blueTeams.map((team, index) => (
              <Table.Td key={`autonomous-total-blue-${index}`}>
                {renderMetricCell(team?.auto.total_points)}
              </Table.Td>
            ))}
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
              {teleopFields.map((field) => (
                <Table.Tr key={`teleop-${field.key}`}>
                  {redTeams.map((team, index) => (
                    <Table.Td key={`teleop-red-${index}-${field.key}`}>
                      {renderMetricCell(field.getTeamStat(team))}
                    </Table.Td>
                  ))}
                  <Table.Td className={classes.redCell}>
                    {renderPredictedCell(sumTeamAverages(redTeams, field.getTeamStat))}
                  </Table.Td>
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      {field.label}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell}>
                    {renderPredictedCell(sumTeamAverages(blueTeams, field.getTeamStat))}
                  </Table.Td>
                  {blueTeams.map((team, index) => (
                    <Table.Td key={`teleop-blue-${index}-${field.key}`}>
                      {renderMetricCell(field.getTeamStat(team))}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </>
          )}
          <Table.Tr className={classes.totalRow}>
            {redTeams.map((team, index) => (
              <Table.Td key={`teleop-total-red-${index}`}>
                {renderMetricCell(team?.teleop.total_points)}
              </Table.Td>
            ))}
            <Table.Td className={classes.redCell}>
              {renderPredictedCell(
                sumTeamAverages(redTeams, (team) => team?.teleop.total_points)
              )}
            </Table.Td>
            <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
              <Text fw={700} ta="center">
                Teleop Total
              </Text>
            </Table.Td>
            <Table.Td className={classes.blueCell}>
              {renderPredictedCell(
                sumTeamAverages(blueTeams, (team) => team?.teleop.total_points)
              )}
            </Table.Td>
            {blueTeams.map((team, index) => (
              <Table.Td key={`teleop-total-blue-${index}`}>
                {renderMetricCell(team?.teleop.total_points)}
              </Table.Td>
            ))}
          </Table.Tr>
          <Table.Tr>
            <Table.Th colSpan={9} className={classes.sectionHeader}>
              Endgame
            </Table.Th>
          </Table.Tr>
          {endgameFields.map((field) => (
            <Table.Tr key={`endgame-${field.key}`}>
              {redTeams.map((team, index) => (
                <Table.Td key={`endgame-red-${index}-${field.key}`}>
                  {renderMetricCell(field.getTeamStat(team))}
                </Table.Td>
              ))}
              <Table.Td className={classes.redCell}>
                {renderPredictedCell(sumTeamAverages(redTeams, field.getTeamStat))}
              </Table.Td>
              <Table.Td className={classes.fieldCell}>
                <Text fw={500} ta="center">
                  {field.label}
                </Text>
              </Table.Td>
              <Table.Td className={classes.blueCell}>
                {renderPredictedCell(sumTeamAverages(blueTeams, field.getTeamStat))}
              </Table.Td>
              {blueTeams.map((team, index) => (
                <Table.Td key={`endgame-blue-${index}-${field.key}`}>
                  {renderMetricCell(field.getTeamStat(team))}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
          <Table.Tr className={classes.totalRow}>
            {redTeams.map((team, index) => (
              <Table.Td key={`total-score-red-${index}`}>
                {renderMetricCell(team?.total_points)}
              </Table.Td>
            ))}
            <Table.Td className={classes.redCell}>
              {renderPredictedCell(
                sumTeamAverages(redTeams, (team) => team?.total_points)
              )}
            </Table.Td>
            <Table.Td className={clsx(classes.fieldCell, classes.totalFieldCell)}>
              <Text fw={700} ta="center">
                Total Score
              </Text>
            </Table.Td>
            <Table.Td className={classes.blueCell}>
              {renderPredictedCell(
                sumTeamAverages(blueTeams, (team) => team?.total_points)
              )}
            </Table.Td>
            {blueTeams.map((team, index) => (
              <Table.Td key={`total-score-blue-${index}`}>
                {renderMetricCell(team?.total_points)}
              </Table.Td>
            ))}
          </Table.Tr>
        </Table.Tbody>
      </Table>
      </Box>
    </Card>
  );
};

interface AllianceTeamImageDisplayProps {
  teamNumber: number;
  imageQuery: TeamImageQueryResult;
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
    return <MissingTeamImage />;
  }

  return <TeamImageCarousel teamNumber={teamNumber} images={images} />;
};

interface TeamImageCarouselProps {
  teamNumber: number;
  images: TeamImage[];
}

const TeamImageCarousel = ({ teamNumber, images }: TeamImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setIsModalOpen(false);
  }, [images]);

  if (!images.length) {
    return <MissingTeamImage />;
  }

  const showControls = images.length > 1;
  const currentImage = images[activeIndex];
  const hasImageUrl = Boolean(currentImage?.image_url);

  const handlePrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  const handleImageClick = () => {
    if (!hasImageUrl) {
      return;
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const imageAlt =
    currentImage.description || `Team ${teamNumber} image ${activeIndex + 1}`;

  return (
    <>
      <Stack gap="xs" align="center" w={180}>
        <Flex align="center" gap="xs" justify="center" w="100%">
          {showControls && (
            <ActionIcon
              aria-label={`Previous image for team ${teamNumber}`}
              variant="light"
              size="sm"
              onClick={handlePrevious}
            >
              <IconChevronLeft size={16} stroke={1.5} />
            </ActionIcon>
          )}
          <Box
            w={140}
            h={120}
            style={{
              overflow: 'hidden',
              borderRadius: 'var(--mantine-radius-md)',
            }}
          >
            <UnstyledButton
              onClick={handleImageClick}
              aria-label={`View larger image for team ${teamNumber}`}
              style={{
                width: '100%',
                height: '100%',
                cursor: hasImageUrl ? 'pointer' : 'default',
              }}
            >
              <Image
                src={currentImage.image_url}
                alt={imageAlt}
                fit="cover"
                height={120}
                width={140}
                radius="md"
                fallbackSrc=""
              />
            </UnstyledButton>
          </Box>
          {showControls && (
            <ActionIcon
              aria-label={`Next image for team ${teamNumber}`}
              variant="light"
              size="sm"
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
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        centered
        size="auto"
        title={`Team ${teamNumber} image`}
      >
        <Image
          src={currentImage.image_url}
          alt={imageAlt}
          fit="contain"
          mah={500}
          maw={600}
          radius="md"
          fallbackSrc=""
        />
        {currentImage.description ? (
          <Text mt="sm" size="sm">
            {currentImage.description}
          </Text>
        ) : null}
      </Modal>
    </>
  );
};

const MissingTeamImage = () => (
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
  </Stack>
);

