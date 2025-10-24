import { useCallback, useState } from 'react';
import { Box, Flex, Paper, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import { DropzoneButton } from '@/components/DropzoneButton/DropzoneButton';
import { DownloadAsButton } from '@/components/ExportHeader/DownloadAsButton';
import { apiFetchResponse } from '@/api';

export function DataImportPage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isUploading) {
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', files[0]);

      try {
        await apiFetchResponse('organization/uploadData', {
          method: 'POST',
          body: formData,
        });

        navigate({ to: '/dataValidation' });
      } catch {
        notifications.show({
          color: 'red',
          title: 'Upload failed',
          message: 'We could not upload your data. Please try again.',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, navigate],
  );

  return (
    <Box p="md" h="100%">
      <Flex direction="column" gap="md" h="100%">
        <Paper
          withBorder
          radius="md"
          p="lg"
          style={{ flex: 1, display: 'flex' }}
        >
          <Stack gap="lg" style={{ flex: 1 }}>
            <Title order={3}>Data Export</Title>
            <DownloadAsButton />
          </Stack>
        </Paper>

        <Paper
          withBorder
          radius="md"
          p="lg"
          style={{ flex: 1, display: 'flex' }}
        >
          <Stack gap="lg" style={{ flex: 1 }}>
            <Title order={3}>Data Import</Title>
            <DropzoneButton onDrop={handleDrop} loading={isUploading} />
          </Stack>
        </Paper>
      </Flex>
    </Box>
  );
}
