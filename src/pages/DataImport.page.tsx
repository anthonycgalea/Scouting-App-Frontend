import { useCallback, useState } from 'react';
import { Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import { DropzoneButton } from '@/components/DropzoneButton/DropzoneButton';
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
    <Box p="md">
      <DropzoneButton onDrop={handleDrop} loading={isUploading} />
    </Box>
  );
}
