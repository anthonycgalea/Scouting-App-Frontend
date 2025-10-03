import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Center,
  Flex,
  Image,
  Loader,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPhoto } from '@tabler/icons-react';
import { useParams } from '@tanstack/react-router';
import { useMatchSchedule } from '@/api';
import { TeamImage, useTeamImages } from '@/api/teams';

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
  const [redAllianceHasImages, setRedAllianceHasImages] = useState(true);
  const [blueAllianceHasImages, setBlueAllianceHasImages] = useState(true);
  const handleRedAllianceImagesChange = useCallback((hasImages: boolean) => {
    setRedAllianceHasImages(hasImages);
  }, []);
  const handleBlueAllianceImagesChange = useCallback((hasImages: boolean) => {
    setBlueAllianceHasImages(hasImages);
  }, []);
  const shouldShowImageRow = redAllianceHasImages || blueAllianceHasImages;

  return (
    <Box p="md">
      <Stack gap="lg">
        <Title order={2}>
          {matchLevelLabel} Match {numericMatchNumber} Preview
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <AllianceCard
            allianceName="Red"
            teamNumbers={redTeamNumbers}
            showImageRow={shouldShowImageRow}
            onImagePresenceChange={handleRedAllianceImagesChange}
          />
          <AllianceCard
            allianceName="Blue"
            teamNumbers={blueTeamNumbers}
            showImageRow={shouldShowImageRow}
            onImagePresenceChange={handleBlueAllianceImagesChange}
          />
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

interface AllianceCardProps {
  allianceName: string;
  teamNumbers: [number, number, number];
  showImageRow: boolean;
  onImagePresenceChange: (hasImages: boolean) => void;
}

const AllianceCard = ({
  allianceName,
  teamNumbers,
  showImageRow,
  onImagePresenceChange,
}: AllianceCardProps) => {
  const [stationOne, stationTwo, stationThree] = teamNumbers;
  const firstTeamImagesQuery = useTeamImages(stationOne);
  const secondTeamImagesQuery = useTeamImages(stationTwo);
  const thirdTeamImagesQuery = useTeamImages(stationThree);
  const teamImageQueries = [firstTeamImagesQuery, secondTeamImagesQuery, thirdTeamImagesQuery];
  const hasTeams = [stationOne, stationTwo, stationThree].some(
    (teamNumber) => Number.isFinite(teamNumber) && teamNumber > 0
  );
  const hasImagesOrLoading = [stationOne, stationTwo, stationThree].some((teamNumber, index) => {
    const query = teamImageQueries[index];
    const isValidTeam = Number.isFinite(teamNumber) && teamNumber > 0;

    if (!isValidTeam) {
      return false;
    }

    if (query.isLoading) {
      return true;
    }

    return (query.data?.length ?? 0) > 0;
  });

  useEffect(() => {
    onImagePresenceChange(hasImagesOrLoading);
  }, [hasImagesOrLoading, onImagePresenceChange]);

  return (
    <Card withBorder radius="md" shadow="sm" padding="lg">
      <Stack gap="lg">
        <Title order={3}>{allianceName} Alliance</Title>
        <Table highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              {[stationOne, stationTwo, stationThree].map((_, index) => (
                <Table.Th key={`station-heading-${index}`} ta="center">
                  Station {index + 1}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {showImageRow && hasTeams && (
              <Table.Tr>
                {[stationOne, stationTwo, stationThree].map((teamNumber, index) => (
                  <Table.Td key={`station-image-${index}`} ta="center" style={{ verticalAlign: 'top' }}>
                    <Center>
                      <AllianceTeamImageDisplay
                        teamNumber={teamNumber}
                        imageQuery={teamImageQueries[index]}
                      />
                    </Center>
                  </Table.Td>
                ))}
              </Table.Tr>
            )}
            <Table.Tr>
              {[stationOne, stationTwo, stationThree].map((teamNumber, index) => {
                const isValidTeam = Number.isFinite(teamNumber) && teamNumber > 0;

                return (
                  <Table.Td key={`station-team-${index}`} ta="center">
                    <Text fw={500}>{isValidTeam ? teamNumber : 'TBD'}</Text>
                  </Table.Td>
                );
              })}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
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
