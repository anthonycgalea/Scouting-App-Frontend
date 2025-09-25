import { Group } from '@mantine/core';
import { DownloadAsButton } from './DownloadAsButton';

export function ExportHeader() {
  return (
    <Group justify="center">
      <h1>Data Validation</h1>
      <DownloadAsButton />
    </Group>
  );
}
