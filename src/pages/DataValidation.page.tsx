import { useState } from 'react';
import { Box, Stack } from '@mantine/core';
import { syncScoutingData } from '@/api';
import { DataManager } from '@/components/DataManager/DataManager';

export function DataValidationPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      await syncScoutingData();
      window.location.reload();
    } catch (error) {
      setIsSyncing(false);
      // eslint-disable-next-line no-console
      console.error('Failed to sync scouting data', error);
    }
  };

  return (
    <Box p="sm">
      <Stack gap="md">
        <DataManager onSync={handleSyncData} isSyncing={isSyncing} />
      </Stack>
    </Box>
  );
}
