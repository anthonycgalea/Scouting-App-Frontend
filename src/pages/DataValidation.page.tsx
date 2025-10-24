import { useState } from 'react';
import { Box } from '@mantine/core';
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
    <Box
      p="sm"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <DataManager onSync={handleSyncData} isSyncing={isSyncing} />
    </Box>
  );
}
