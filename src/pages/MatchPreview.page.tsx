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
} from '@mantine/core';
import clsx from 'clsx';
import { IconChevronLeft, IconChevronRight, IconPhoto } from '@tabler/icons-react';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';
import { TeamImage, useTeamImages } from '@/api/teams';
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

  const autonomousFields = ['L4', 'L3', 'L2', 'L1', 'Net', 'Processor'];
  const teleopFields = ['L4', 'L3', 'L2', 'L1', 'Net', 'Processor'];
  const endgameFields = ['Endgame Points'];

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
                  <Text fw={500}>Predicted</Text>
                </Table.Td>
                <Table.Td className={classes.fieldCell}>
                  <Text fw={500} ta="center">
                    Team Number
                  </Text>
                </Table.Td>
                <Table.Td className={classes.blueCell} ta="center">
                  <Text fw={500}>Predicted</Text>
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
                  Autonomous
                </Table.Th>
              </Table.Tr>
              {autonomousFields.map((field) => (
                <Table.Tr key={`autonomous-${field}`}>
                  {redTeamNumbers.map((_, index) => (
                    <Table.Td key={`autonomous-red-${index}-${field}`} />
                  ))}
                  <Table.Td className={classes.redCell} />
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      {field}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell} />
                  {blueTeamNumbers.map((_, index) => (
                    <Table.Td key={`autonomous-blue-${index}-${field}`} />
                  ))}
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Th colSpan={9} className={classes.sectionHeader}>
                  Teleop
                </Table.Th>
              </Table.Tr>
              {teleopFields.map((field) => (
                <Table.Tr key={`teleop-${field}`}>
                  {redTeamNumbers.map((_, index) => (
                    <Table.Td key={`teleop-red-${index}-${field}`} />
                  ))}
                  <Table.Td className={classes.redCell} />
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      {field}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell} />
                  {blueTeamNumbers.map((_, index) => (
                    <Table.Td key={`teleop-blue-${index}-${field}`} />
                  ))}
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Th colSpan={9} className={classes.sectionHeader}>
                  Endgame
                </Table.Th>
              </Table.Tr>
              {endgameFields.map((field) => (
                <Table.Tr key={`endgame-${field}`}>
                  {redTeamNumbers.map((_, index) => (
                    <Table.Td key={`endgame-red-${index}-${field}`} />
                  ))}
                  <Table.Td className={classes.redCell} />
                  <Table.Td className={classes.fieldCell}>
                    <Text fw={500} ta="center">
                      {field}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.blueCell} />
                  {blueTeamNumbers.map((_, index) => (
                    <Table.Td key={`endgame-blue-${index}-${field}`} />
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Box>
  );
}

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
