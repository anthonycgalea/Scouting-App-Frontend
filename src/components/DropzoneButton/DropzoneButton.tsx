import { type ComponentProps, useRef } from 'react';
import { IconCloudUpload, IconDownload, IconX } from '@tabler/icons-react';
import { Button, Group, Text, useMantineTheme } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import classes from './DropzoneButton.module.css';

type DropzoneOnDrop = ComponentProps<typeof Dropzone>['onDrop'];

export interface DropzoneButtonProps {
  onDrop?: DropzoneOnDrop;
  loading?: boolean;
}

export function DropzoneButton({ onDrop, loading }: DropzoneButtonProps) {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper}>
      <Dropzone
        openRef={openRef}
        onDrop={onDrop}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.csv]}
        maxSize={100 * 1024 ** 2}
        multiple={false}
        loading={loading}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload size={50} stroke={1.5} className={classes.icon} />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Drop your CSV here</Dropzone.Accept>
            <Dropzone.Reject>Only CSV files less than 100mb</Dropzone.Reject>
            <Dropzone.Idle>Upload match data</Dropzone.Idle>
          </Text>

          <Text className={classes.description}>
            Drag&apos;n&apos;drop files here to upload. We can accept only <i>.csv</i> files that
            are less than 100mb in size.
          </Text>
        </div>
      </Dropzone>

      <Button
        className={classes.control}
        size="md"
        radius="xl"
        onClick={() => openRef.current?.()}
        loading={loading}
        disabled={loading}
      >
        Select files
      </Button>
    </div>
  );
}