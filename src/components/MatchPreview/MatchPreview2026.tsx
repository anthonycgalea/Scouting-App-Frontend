import { useEffect, useMemo, useState } from 'react';
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
import {
  useMatchImages,
  type MatchPreviewResponse2026,
  type MatchScheduleEntry,
  type MetricStatistics,
  type TeamMatchPreview2026,
  type EventTeamImageSummary,
} from '@/api';
import classes from '@/pages/MatchPreview.module.css';

interface MatchPreview2026Props {
  match: MatchScheduleEntry;
  preview: MatchPreviewResponse2026;
  className?: string;
  contentClassName?: string;
}

type AllianceTeam = TeamMatchPreview2026 | undefined;

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

export const MatchPreview2026 = ({
  match,
  preview,
  className,
  contentClassName,
}: MatchPreview2026Props) => {
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
  const normalizedMatchLevel = match.match_level?.toLowerCase() ?? '';
  const shouldFetchMatchImages =
    normalizedMatchLevel.length > 0 &&
    Number.isFinite(match.match_number) &&
    (match.match_number ?? 0) > 0;
  const matchImagesParams = shouldFetchMatchImages
    ? { matchLevel: normalizedMatchLevel, matchNumber: match.match_number }
    : undefined;
  const {
    data: matchImages = [],
    isLoading: isMatchImagesLoading,
    isError: isMatchImagesError,
  } = useMatchImages(matchImagesParams);
  const matchImagesByTeam = useMemo(() => {
    const imageMap = new Map<number, EventTeamImageSummary[]>();

    matchImages.forEach((entry) => {
      const teamNumber = entry.teamNumber;

      if (Number.isFinite(teamNumber)) {
        imageMap.set(teamNumber, entry.images ?? []);
      }
    });

    return imageMap;
  }, [matchImages]);

  const hasValidTeam = (teamNumber: number) => Number.isFinite(teamNumber) && teamNumber > 0;

  const autonomousFields: FieldConfig[] = [
    { key: 'auto-fuel-scored', label: 'Fuel Scored', getTeamStat: (team) => team?.auto.fuel_scored },
    { key: 'auto-fuel-passed', label: 'Fuel Passed', getTeamStat: (team) => team?.auto.fuel_passed },
    { key: 'auto-climb-points', label: 'Auto Climb Points', getTeamStat: (team) => team?.auto.climb_points },
  ];
  const teleopFields: FieldConfig[] = [
    { key: 'teleop-fuel-scored', label: 'Fuel Scored', getTeamStat: (team) => team?.teleop.fuel_scored },
    { key: 'teleop-fuel-passed', label: 'Fuel Passed', getTeamStat: (team) => team?.teleop.fuel_passed },
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
                      images={matchImagesByTeam.get(teamNumber)}
                      isLoading={isMatchImagesLoading}
                      isError={isMatchImagesError}
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
                      images={matchImagesByTeam.get(teamNumber)}
                      isLoading={isMatchImagesLoading}
                      isError={isMatchImagesError}
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
  images?: EventTeamImageSummary[];
  isLoading: boolean;
  isError: boolean;
}

type DisplayImage = {
  image_url: string;
  description?: string;
};

const AllianceTeamImageDisplay = ({
  teamNumber,
  images,
  isLoading,
  isError,
}: AllianceTeamImageDisplayProps) => {
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

  if (isError) {
    return <MissingTeamImage teamNumber={teamNumber} />;
  }

  const formattedImages: DisplayImage[] = (images ?? [])
    .filter((image): image is EventTeamImageSummary => {
      if (!image) {
        return false;
      }

      return typeof image.image_url === 'string' && image.image_url.trim().length > 0;
    })
    .map((image) => ({
      image_url: image.image_url,
      description: image.description ?? undefined,
    }));

  if (formattedImages.length === 0) {
    return <MissingTeamImage teamNumber={teamNumber} />;
  }

  return <TeamImageCarousel teamNumber={teamNumber} images={formattedImages} />;
};

interface TeamImageCarouselProps {
  teamNumber: number;
  images: DisplayImage[];
}

const TeamImageCarousel = ({ teamNumber, images }: TeamImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setIsModalOpen(false);
  }, [images]);

  if (!images.length) {
    return <MissingTeamImage teamNumber={teamNumber} />;
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

  return (
    <>
      <Box className={classes.imageContainer}>
        <ActionIcon
          variant="default"
          size="lg"
          radius="md"
          className={clsx(classes.carouselButton, classes.carouselButtonLeft)}
          onClick={handlePrevious}
          disabled={!showControls}
          aria-label="Previous team image"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <UnstyledButton
          className={classes.imageButton}
          onClick={handleImageClick}
          aria-label={`Open team ${teamNumber} image`}
          disabled={!hasImageUrl}
        >
          {hasImageUrl ? (
            <Image
              src={currentImage?.image_url}
              alt={currentImage?.description ?? `Team ${teamNumber} robot`}
              radius="md"
              className={classes.teamImage}
            />
          ) : (
            <MissingTeamImage teamNumber={teamNumber} />
          )}
        </UnstyledButton>
        <ActionIcon
          variant="default"
          size="lg"
          radius="md"
          className={clsx(classes.carouselButton, classes.carouselButtonRight)}
          onClick={handleNext}
          disabled={!showControls}
          aria-label="Next team image"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </Box>
      <Text fz="xs" c="dimmed" ta="center">
        {currentImage?.description ?? `Team ${teamNumber} robot`}
      </Text>
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Team ${teamNumber}`}
        centered
        size="lg"
      >
        {hasImageUrl ? (
          <Image
            src={currentImage?.image_url}
            alt={currentImage?.description ?? `Team ${teamNumber} robot`}
            radius="md"
          />
        ) : (
          <MissingTeamImage teamNumber={teamNumber} />
        )}
      </Modal>
    </>
  );
};

const MissingTeamImage = ({ teamNumber }: { teamNumber: number }) => (
  <Stack align="center" justify="center" w={180} h={120} className={classes.imageFallback}>
    <IconPhoto size={40} stroke={1.5} />
    <Text fz="xs" c="dimmed" ta="center">
      No images available for team {teamNumber}
    </Text>
  </Stack>
);
