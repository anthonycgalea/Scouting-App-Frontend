import { Text } from '@mantine/core';

interface MatchNumberButtonMenuProps {
  matchNumber: number;
}

export function DataManagerButtonMenu({ matchNumber }: MatchNumberButtonMenuProps) {
  return (
    <Text fw={500} component="span">
      Match {matchNumber}
    </Text>
  );
}