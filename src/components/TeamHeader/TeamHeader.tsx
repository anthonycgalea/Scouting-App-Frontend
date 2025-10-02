import { useEffect, useState } from 'react';
import { Alert, ActionIcon, Box, Flex, Image, Skeleton, Text, Title } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { TeamImage, useTeamImages, useTeamInfo } from '@/api';
import classes from './TeamHeader.module.css';

interface TeamHeaderProps {
  teamNumber: number;
}

interface TeamImageCarouselProps {
  images: TeamImage[];
}

const TeamImageCarousel = ({ images }: TeamImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (!images.length) {
    return null;
  }

  const currentImage = images[activeIndex];
  const showControls = images.length > 1;

  const handlePrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  return (
    <Flex className={classes.Carousel} align="center" gap="xs">
      {showControls && (
        <ActionIcon
          aria-label="View previous team image"
          variant="light"
          onClick={handlePrevious}
        >
          <IconChevronLeft size={18} stroke={1.5} />
        </ActionIcon>
      )}
      <Box className={classes.ImageFrame}>
        <Image
          src={currentImage.image_url}
          alt={currentImage.description || `Team image ${activeIndex + 1}`}
          fit="contain"
          radius="sm"
          fallbackSrc=""
        />
      </Box>
      {showControls && (
        <ActionIcon aria-label="View next team image" variant="light" onClick={handleNext}>
          <IconChevronRight size={18} stroke={1.5} />
        </ActionIcon>
      )}
      <Text size="sm" c="dimmed" className={classes.ImageCaption}>
        {activeIndex + 1} / {images.length}
      </Text>
    </Flex>
  );
};

export const TeamHeader = ({ teamNumber }: TeamHeaderProps) => {
  const {
    data: teamInfo,
    isLoading,
    isError,
  } = useTeamInfo(teamNumber);
  const { data: teamImages } = useTeamImages(teamNumber);

  if (isLoading) {
    return <Skeleton height={34} width="50%" radius="sm" />;
  }

  if (isError) {
    return (
      <Alert color="red" title="Unable to load team information">
        Team {teamNumber}
      </Alert>
    );
  }

  const titleContent = teamInfo ? (
    <Title className={classes.Title} order={2}>
      Team {teamInfo.team_number} - {teamInfo.team_name}
    </Title>
  ) : (
    <Title className={classes.Title} order={2}>
      Team {teamNumber}
    </Title>
  );

  const hasImages = (teamImages?.length ?? 0) > 0;

  if (!hasImages) {
    return titleContent;
  }

  return (
    <Flex className={classes.HeaderContent} align="center" gap="md">
      {titleContent}
      <TeamImageCarousel images={teamImages ?? []} />
    </Flex>
  );
};
