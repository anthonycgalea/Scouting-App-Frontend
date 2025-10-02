import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActionIcon,
  Box,
  Flex,
  Image,
  Loader,
  Skeleton,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconChevronRight, IconLibraryPlus } from '@tabler/icons-react';
import { ApiError, TeamImage, useTeamImages, useTeamInfo, useUploadTeamImage } from '@/api';
import classes from './TeamHeader.module.css';

interface TeamHeaderProps {
  teamNumber: number;
}

interface TeamImageCarouselProps {
  images: TeamImage[];
}

const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

interface TeamImageUploadButtonProps {
  teamNumber: number;
}

const TeamImageUploadButton = ({ teamNumber }: TeamImageUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync: uploadImage, isPending } = useUploadTeamImage(teamNumber);

  const resetInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelection = useCallback(
    async (file: File | null) => {
      if (!file) {
        resetInput();
        return;
      }

      if (file.size === 0) {
        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message: 'Selected file is empty. Please choose a different file.',
        });
        resetInput();
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message: 'Images must be 10 MB or smaller.',
        });
        resetInput();
        return;
      }

      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
      const hasValidExtension = ACCEPTED_IMAGE_EXTENSIONS.includes(extension);
      const hasValidMimeType =
        file.type === '' || ACCEPTED_IMAGE_MIME_TYPES.includes(file.type);

      if (!hasValidExtension || !hasValidMimeType) {
        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message: 'Images must be one of: JPG, JPEG, PNG, GIF, BMP, or WEBP.',
        });
        resetInput();
        return;
      }

      try {
        await uploadImage({ file });
        notifications.show({
          color: 'green',
          title: 'Image uploaded',
          message: 'Your image has been uploaded successfully.',
        });
      } catch (error) {
        let message = 'We could not upload your image. Please try again.';

        if (
          error instanceof ApiError &&
          typeof error.metadata.body === 'object' &&
          error.metadata.body !== null
        ) {
          const { detail } = error.metadata.body as { detail?: unknown };

          if (typeof detail === 'string') {
            message = detail;
          }
        }

        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message,
        });
      } finally {
        resetInput();
      }
    },
    [resetInput, uploadImage],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0] ?? null;
      void handleFileSelection(file);
    },
    [handleFileSelection],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ACCEPTED_IMAGE_EXTENSIONS, ...ACCEPTED_IMAGE_MIME_TYPES].join(',')}
        className={classes.FileInput}
        onChange={handleFileChange}
      />
      <Tooltip label="Upload team image" position="bottom">
        <ActionIcon
          variant="light"
          size="lg"
          aria-label="Upload team image"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader size="sm" /> : <IconLibraryPlus size={18} stroke={1.5} />}
        </ActionIcon>
      </Tooltip>
    </>
  );
};

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

  const headerTitle = (
    <Flex className={classes.TitleRow} align="center" gap="sm">
      <TeamImageUploadButton teamNumber={teamNumber} />
      {titleContent}
    </Flex>
  );

  const hasImages = (teamImages?.length ?? 0) > 0;

  if (!hasImages) {
    return headerTitle;
  }

  return (
    <Flex className={classes.HeaderContent} align="center" gap="md">
      {headerTitle}
      <TeamImageCarousel images={teamImages ?? []} />
    </Flex>
  );
};
